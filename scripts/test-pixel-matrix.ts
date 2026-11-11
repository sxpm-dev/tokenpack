#!/usr/bin/env tsx
//
// Sanity test: can vision models actually read exact pixel values from a tiny image?
//
// Generates a small RGBA test image with deterministic pixel values, sends it
// to each provider, asks for the pixel matrix in JSON, and scores per-pixel.
// Pure isolation test — no compression, no decoding, just "read this pixel grid".

import { existsSync, mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import sharp from 'sharp'

loadDotenv()

function loadDotenv(): void {
  const envPath = path.resolve('.env')
  if (!existsSync(envPath)) return
  const loader = (process as unknown as { loadEnvFile?: (file: string) => void }).loadEnvFile
  if (typeof loader === 'function') loader.call(process, envPath)
}

type ProviderName = 'openai' | 'anthropic'

interface ModelSpec {
  provider: ProviderName
  modelId: string
}

interface Args {
  size: number
  out: string
  providers: ProviderName[]
  models: ModelSpec[]
  maxOutput: number
  reasoningEffort: 'minimal' | 'low' | 'medium' | 'high'
  thinkingBudgetTokens: number
  help?: boolean
}

function usage(): string {
  return `Usage:
  yarn bench:pixel-matrix [--size 8] [--models openai:gpt-4o,anthropic:claude-opus-4-5]

Generates an NxN RGBA image with deterministic pixels, sends it to each
listed model, asks for the pixel matrix as JSON, and reports per-pixel accuracy.

Options:
  --size <n>                 Image side length in pixels. Default: 8 (64 pixels).
  --models <list>            Comma-separated provider:model entries. Overrides --providers.
                             Examples:
                               --models openai:gpt-4o,openai:gpt-5-mini
                               --models anthropic:claude-opus-4-5-20250929
                               --models openai:gpt-4o,anthropic:claude-sonnet-4-5-20250929
  --providers <list>         Used when --models is not set. Picks the default
                             model from OPENAI_MODEL / ANTHROPIC_MODEL env vars
                             for each provider. Default: openai,anthropic
  --out <dir>                Default: ./tmp/llm-pixel-matrix-test
  --max-output <n>           Max output tokens. Default: 6000
  --reasoning-effort <lvl>   OpenAI reasoning effort: minimal|low|medium|high
  --thinking <budget>        Anthropic extended-thinking budget tokens
  --help
`
}

function parseModelSpec(token: string): ModelSpec {
  const idx = token.indexOf(':')
  if (idx <= 0) throw new Error(`--models entry must look like provider:modelId, got "${token}"`)
  const provider = token.slice(0, idx).trim()
  const modelId = token.slice(idx + 1).trim()
  if (provider !== 'openai' && provider !== 'anthropic') {
    throw new Error(`Unsupported provider in --models: "${provider}"`)
  }
  if (!modelId) throw new Error(`--models entry "${token}" has empty modelId`)
  return { provider, modelId }
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    size: 8,
    out: path.resolve('tmp/llm-pixel-matrix-test'),
    providers: ['openai', 'anthropic'],
    models: [],
    maxOutput: 6000,
    reasoningEffort: 'medium',
    thinkingBudgetTokens: 0,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    const next = (): string => {
      const value = argv[++i]
      if (!value) throw new Error(`Missing value for ${arg}`)
      return value
    }
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--size') args.size = Number(next())
    else if (arg === '--out') args.out = path.resolve(next())
    else if (arg === '--models') {
      args.models = next()
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map(parseModelSpec)
    } else if (arg === '--providers') {
      args.providers = next()
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => {
          if (value !== 'openai' && value !== 'anthropic') {
            throw new Error(`Unsupported provider: ${value}`)
          }
          return value
        })
    } else if (arg === '--max-output') args.maxOutput = Number(next())
    else if (arg === '--reasoning-effort') {
      const value = next()
      if (value !== 'minimal' && value !== 'low' && value !== 'medium' && value !== 'high') {
        throw new Error(`--reasoning-effort must be minimal|low|medium|high`)
      }
      args.reasoningEffort = value
    } else if (arg === '--thinking') args.thinkingBudgetTokens = Number(next())
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function seededValue(seed: number): number {
  let value = seed >>> 0
  value ^= value << 13
  value ^= value >>> 17
  value ^= value << 5
  return value >>> 0
}

interface Pixel {
  r: number
  g: number
  b: number
  a: number
}

function buildPixels(size: number): Pixel[][] {
  const matrix: Pixel[][] = []
  for (let y = 0; y < size; y += 1) {
    const row: Pixel[] = []
    for (let x = 0; x < size; x += 1) {
      const hash = seededValue(y * 1000 + x + 9)
      row.push({
        r: hash & 0xff,
        g: (hash >> 8) & 0xff,
        b: (hash >> 16) & 0xff,
        a: 255,
      })
    }
    matrix.push(row)
  }
  return matrix
}

async function writeImage(matrix: Pixel[][], outPath: string): Promise<void> {
  const size = matrix.length
  const raw = Buffer.alloc(size * size * 4)
  let offset = 0
  for (const row of matrix) {
    for (const pixel of row) {
      raw[offset++] = pixel.r
      raw[offset++] = pixel.g
      raw[offset++] = pixel.b
      raw[offset++] = pixel.a
    }
  }
  await sharp(raw, { raw: { width: size, height: size, channels: 4 } })
    .png({ compressionLevel: 0 })
    .toFile(outPath)
}

function buildPrompt(size: number): string {
  return `The attached PNG is a ${size}x${size} RGBA image. Each pixel has explicit, distinct RGB values (alpha is always 255). Pixels are not interpolated and there is no anti-aliasing.

Return ONLY a single JSON object with this exact shape — no explanation, no markdown fence:
{
  "size": ${size},
  "matrix": [
    [ "rgba(R,G,B,A)", "rgba(R,G,B,A)", ...${size} entries ],
    ...${size} rows
  ]
}

Each cell MUST be a string of the form "rgba(R,G,B,A)" where R, G, B, A are integers 0..255.
Row 0 is the top row, column 0 is the leftmost column.
If you cannot determine an exact value for a given pixel, return its best estimate as integers (do not return null or omit cells). Estimating is OK; the goal is to measure how close your values are to the truth.`
}

function makeProvider(spec: ModelSpec): { provider: ProviderName; modelId: string; model: unknown } {
  if (spec.provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing')
    return { provider: 'openai', modelId: spec.modelId, model: openai(spec.modelId) }
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing')
  return { provider: 'anthropic', modelId: spec.modelId, model: anthropic(spec.modelId) }
}

function resolveModelSpecs(args: Args): ModelSpec[] {
  if (args.models.length > 0) return args.models
  return args.providers.map((provider) => ({
    provider,
    modelId:
      provider === 'openai'
        ? (process.env.OPENAI_MODEL ?? 'gpt-5.4-mini')
        : (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929'),
  }))
}

interface RawResult {
  provider: ProviderName
  modelId: string
  ok: boolean
  elapsedMs: number
  text?: string
  error?: string
  usage?: Record<string, unknown>
}

async function runCall(
  providerConfig: ReturnType<typeof makeProvider>,
  prompt: string,
  image: Buffer,
  args: Args,
): Promise<RawResult> {
  const started = performance.now()
  const providerOptions: Record<string, Record<string, unknown>> = {}
  if (providerConfig.provider === 'openai') {
    providerOptions.openai = { reasoningEffort: args.reasoningEffort }
  }
  if (providerConfig.provider === 'anthropic' && args.thinkingBudgetTokens > 0) {
    providerOptions.anthropic = {
      thinking: { type: 'enabled', budgetTokens: args.thinkingBudgetTokens },
    }
  }
  try {
    const generateOptions: Parameters<typeof generateText>[0] = {
      model: providerConfig.model as Parameters<typeof generateText>[0]['model'],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image, mediaType: 'image/png' },
          ],
        },
      ],
      maxOutputTokens: args.maxOutput,
    }
    if (Object.keys(providerOptions).length > 0) {
      ;(generateOptions as { providerOptions?: typeof providerOptions }).providerOptions =
        providerOptions
    }
    const result = (await generateText(generateOptions)) as unknown as {
      text?: string
      totalUsage?: unknown
      usage?: unknown
    }
    return {
      provider: providerConfig.provider,
      modelId: providerConfig.modelId,
      ok: true,
      elapsedMs: Math.round(performance.now() - started),
      text: result.text,
      usage: (result.totalUsage ?? result.usage) as Record<string, unknown> | undefined,
    }
  } catch (error: unknown) {
    return {
      provider: providerConfig.provider,
      modelId: providerConfig.modelId,
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function parseMatrix(text: string | undefined): Pixel[][] | undefined {
  if (!text) return undefined
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1]!.trim() : text.trim()
  let payload: unknown
  try {
    payload = JSON.parse(candidate)
  } catch {
    const first = candidate.indexOf('{')
    const last = candidate.lastIndexOf('}')
    if (first < 0 || last <= first) return undefined
    try {
      payload = JSON.parse(candidate.slice(first, last + 1))
    } catch {
      return undefined
    }
  }
  const root = payload as { matrix?: unknown }
  if (!Array.isArray(root.matrix)) return undefined
  const matrix: Pixel[][] = []
  for (const rawRow of root.matrix) {
    if (!Array.isArray(rawRow)) return undefined
    const row: Pixel[] = []
    for (const cell of rawRow) {
      const parsed = parseRgba(cell)
      if (!parsed) return undefined
      row.push(parsed)
    }
    matrix.push(row)
  }
  return matrix
}

function parseRgba(value: unknown): Pixel | undefined {
  if (typeof value !== 'string') return undefined
  const match = value.match(/^\s*rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)\s*$/i)
  if (!match) return undefined
  const r = Number(match[1])
  const g = Number(match[2])
  const b = Number(match[3])
  const a = match[4] === undefined ? 255 : Number(match[4]) <= 1 ? Math.round(Number(match[4]) * 255) : Number(match[4])
  if (![r, g, b, a].every((v) => Number.isFinite(v) && v >= 0 && v <= 255)) return undefined
  return { r, g, b, a }
}

interface Score {
  exact: number
  within5: number
  within20: number
  within50: number
  total: number
  meanError: number
  maxError: number
}

function scoreMatrix(actual: Pixel[][], predicted: Pixel[][] | undefined): Score | undefined {
  if (!predicted) return undefined
  if (predicted.length !== actual.length) return undefined
  let exact = 0
  let within5 = 0
  let within20 = 0
  let within50 = 0
  let total = 0
  let errorSum = 0
  let maxError = 0
  for (let y = 0; y < actual.length; y += 1) {
    if (predicted[y]!.length !== actual[y]!.length) return undefined
    for (let x = 0; x < actual[y]!.length; x += 1) {
      total += 1
      const a = actual[y]![x]!
      const p = predicted[y]![x]!
      const dr = Math.abs(a.r - p.r)
      const dg = Math.abs(a.g - p.g)
      const db = Math.abs(a.b - p.b)
      const maxChannel = Math.max(dr, dg, db)
      const mean = (dr + dg + db) / 3
      errorSum += mean
      if (mean > maxError) maxError = mean
      if (maxChannel === 0) exact += 1
      if (maxChannel <= 5) within5 += 1
      if (maxChannel <= 20) within20 += 1
      if (maxChannel <= 50) within50 += 1
    }
  }
  return {
    exact,
    within5,
    within20,
    within50,
    total,
    meanError: Number((errorSum / total).toFixed(2)),
    maxError: Number(maxError.toFixed(2)),
  }
}

function pad(value: string, width: number): string {
  return value.padStart(width)
}

function fmt(pixel: Pixel): string {
  return `${pad(String(pixel.r), 3)},${pad(String(pixel.g), 3)},${pad(String(pixel.b), 3)}`
}

function printSideBySide(actual: Pixel[][], predicted: Pixel[][]): void {
  const size = actual.length
  for (let y = 0; y < size; y += 1) {
    const actualRow = actual[y]!.map(fmt).join(' | ')
    const predictedRow = predicted[y]!.map(fmt).join(' | ')
    console.log(`  truth:  [ ${actualRow} ]`)
    console.log(`  model:  [ ${predictedRow} ]`)
    if (y < size - 1) console.log('')
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(usage())
    return
  }

  mkdirSync(args.out, { recursive: true })
  const matrix = buildPixels(args.size)
  const imagePath = path.join(args.out, `truth-${args.size}x${args.size}.png`)
  await writeImage(matrix, imagePath)
  const truthPath = path.join(args.out, `truth-${args.size}x${args.size}.json`)
  await writeFile(
    truthPath,
    JSON.stringify(
      {
        size: args.size,
        matrix: matrix.map((row) => row.map((p) => `rgba(${p.r},${p.g},${p.b},${p.a})`)),
      },
      null,
      2,
    ),
  )
  console.log(`Truth image:   ${imagePath}`)
  console.log(`Truth matrix:  ${truthPath}`)
  console.log('')

  const image = await readFile(imagePath)
  const prompt = buildPrompt(args.size)
  const modelSpecs = resolveModelSpecs(args)
  console.log(`Models under test (${modelSpecs.length}):`)
  for (const spec of modelSpecs) console.log(`  - ${spec.provider}:${spec.modelId}`)
  console.log('')

  const providers = modelSpecs.map(makeProvider)

  const summary: Array<{ provider: ProviderName; modelId: string; score?: Score; elapsedMs: number; usage?: Record<string, unknown>; error?: string }> = []

  for (const providerConfig of providers) {
    console.log(`Running ${providerConfig.provider}/${providerConfig.modelId}...`)
    const result = await runCall(providerConfig, prompt, image, args)
    const predicted = result.ok ? parseMatrix(result.text) : undefined
    const score = predicted ? scoreMatrix(matrix, predicted) : undefined

    summary.push({
      provider: result.provider,
      modelId: result.modelId,
      score,
      elapsedMs: result.elapsedMs,
      usage: result.usage,
      error: result.error,
    })

    if (!result.ok) {
      console.log(`  ✗ call failed: ${result.error}`)
      console.log('')
      continue
    }
    console.log(`  ok ${result.elapsedMs}ms`)
    if (!predicted) {
      console.log('  ✗ could not parse a matrix from the response')
      console.log(`  preview: ${(result.text ?? '').slice(0, 300)}`)
      console.log('')
      continue
    }
    if (!score) {
      console.log('  ✗ matrix shape did not match (expected ' +
        `${args.size}x${args.size}, got ${predicted.length}x${predicted[0]?.length ?? 0})`)
      console.log('')
      continue
    }
    console.log(
      `  per-pixel: exact=${score.exact}/${score.total}` +
        ` within5=${score.within5}` +
        ` within20=${score.within20}` +
        ` within50=${score.within50}` +
        ` meanErr=${score.meanError}` +
        ` maxErr=${score.maxError}`,
    )
    if (args.size <= 8) {
      console.log('')
      printSideBySide(matrix, predicted)
    }
    console.log('')
  }

  console.log('=== Summary ===')
  console.log('provider                                 exact   within5   within20   within50   meanErr   maxErr')
  console.log('───────────────────────────────────────  ──────  ────────  ─────────  ─────────  ───────   ──────')
  for (const row of summary) {
    if (!row.score) {
      console.log(`${row.provider}/${row.modelId}: ${row.error ?? 'no matrix parsed'}`)
      continue
    }
    console.log(
      [
        `${row.provider}/${row.modelId}`.padEnd(40),
        `${row.score.exact}/${row.score.total}`.padStart(7),
        `${row.score.within5}/${row.score.total}`.padStart(9),
        `${row.score.within20}/${row.score.total}`.padStart(10),
        `${row.score.within50}/${row.score.total}`.padStart(10),
        String(row.score.meanError).padStart(9),
        String(row.score.maxError).padStart(8),
      ].join('  '),
    )
  }

  await writeFile(
    path.join(args.out, 'report.json'),
    JSON.stringify({ args, truth: matrix, summary }, null, 2),
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
