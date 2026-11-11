#!/usr/bin/env tsx
//
// Pixel-matrix test using each provider's OFFICIAL SDK directly (no AI SDK).
//
// Why: lets us pass provider-specific knobs the AI SDK abstracts away.
// In particular OpenAI's `detail: 'high'` for image inputs, which controls
// how much vision-token budget the model spends per image.

import { createReadStream, existsSync, mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
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
  models: ModelSpec[]
  providers: ProviderName[]
  maxOutput: number
  detail: 'low' | 'high' | 'auto'
  codeInterpreter: boolean
  inlineImage: boolean
  help?: boolean
}

function usage(): string {
  return `Usage:
  yarn tsx scripts/test-pixel-matrix-direct.ts [--size 8] [--models openai:gpt-4o,...]

Pixel-matrix probe using openai and @anthropic-ai/sdk DIRECTLY (no Vercel AI SDK).

Options:
  --size <n>             Image side length. Default: 8.
  --models <list>        provider:modelId, comma-separated.
                         Examples:
                           openai:gpt-4o,openai:gpt-4o-mini
                           anthropic:claude-opus-4-5,anthropic:claude-sonnet-4-5-20250929
  --providers <list>     Used when --models is not set. Falls back to OPENAI_MODEL /
                         ANTHROPIC_MODEL env. Default: openai,anthropic
  --detail <low|high|auto>
                         OpenAI image detail. Default: high.
                         'high' uses 512x512 tiles + more vision tokens — gives the
                         model its best chance to see individual pixels.
  --code-interpreter, -c Use server-side hosted code execution:
                           OpenAI:    Responses API + code_interpreter tool
                                      (file uploaded via Files API)
                           Anthropic: beta code_execution_20250522 tool
                                      (file uploaded via beta Files API)
                         Model writes Python that reads the actual pixel bytes.
  --inline-image         When set with --code-interpreter, skip the file upload
                         and embed the PNG as base64 inside the prompt. The model
                         base64-decodes it inside its code-execution sandbox.
                         One HTTPS call instead of two; trades file-upload cost
                         for extra input tokens (~4/3 of PNG size).
  --out <dir>            Default: ./tmp/llm-pixel-matrix-test-direct
  --max-output <n>       Max output tokens. Default: 6000.
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
    out: path.resolve('tmp/llm-pixel-matrix-test-direct'),
    models: [],
    providers: ['openai', 'anthropic'],
    maxOutput: 6000,
    detail: 'high',
    codeInterpreter: false,
    inlineImage: false,
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
    else if (arg === '--max-output') args.maxOutput = Number(next())
    else if (arg === '--detail') {
      const value = next()
      if (value !== 'low' && value !== 'high' && value !== 'auto') {
        throw new Error(`--detail must be low|high|auto, got ${value}`)
      }
      args.detail = value
    } else if (arg === '--code-interpreter' || arg === '-c') {
      args.codeInterpreter = true
    } else if (arg === '--inline-image') {
      args.inlineImage = true
    } else if (arg === '--models') {
      args.models = next().split(',').map((s) => s.trim()).filter(Boolean).map(parseModelSpec)
    } else if (arg === '--providers') {
      args.providers = next()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((value) => {
          if (value !== 'openai' && value !== 'anthropic') {
            throw new Error(`Unsupported provider: ${value}`)
          }
          return value
        })
    } else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function resolveModelSpecs(args: Args): ModelSpec[] {
  if (args.models.length > 0) return args.models
  return args.providers.map((provider) => ({
    provider,
    modelId:
      provider === 'openai'
        ? (process.env.OPENAI_MODEL ?? 'gpt-4o')
        : (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929'),
  }))
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
      row.push({ r: hash & 0xff, g: (hash >> 8) & 0xff, b: (hash >> 16) & 0xff, a: 255 })
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
  return `The attached PNG is a ${size}x${size} RGBA image. Each pixel has explicit, distinct RGB values (alpha is always 255). No anti-aliasing.

Return ONLY a single JSON object — no explanation, no markdown fence:
{
  "size": ${size},
  "matrix": [
    [ "rgba(R,G,B,A)", "rgba(R,G,B,A)", ... ${size} entries ],
    ... ${size} rows
  ]
}

Each cell MUST be "rgba(R,G,B,A)" with integers 0..255. Row 0 is top, column 0 is leftmost. Estimating is OK.`
}

function buildCodeInterpreterInlinePrompt(size: number, imageBase64: string): string {
  return `You have a code-execution tool with Python (PIL/Pillow, numpy, base64, io). A PNG file has been embedded below as a base64 string.

Do not try to "look" at any image visually — there is no image attachment. Use the code tool:
  import base64, io
  from PIL import Image
  data = base64.b64decode(B64)
  img = Image.open(io.BytesIO(data)).convert("RGBA")
  w, h = img.size           # both ${size}
  rows = []
  for y in range(h):
      row = []
      for x in range(w):
          r, g, b, a = img.getpixel((x, y))
          row.append(f"rgba({r},{g},{b},{a})")
      rows.append(row)
  import json
  print(json.dumps({"size": ${size}, "matrix": rows}))

After running your code, return ONLY this JSON (no explanation, no markdown fence):
{
  "size": ${size},
  "matrix": [ [ "rgba(R,G,B,A)", ... ${size} ], ... ${size} ]
}

Row 0 is top, column 0 is leftmost. Alpha is always 255. Use exact byte values 0..255 from img.getpixel — do not estimate.

B64 = """${imageBase64}"""`
}

function buildCodeInterpreterPrompt(size: number, fileName: string): string {
  return `You have a code-execution tool with Python available (PIL/Pillow, numpy). A PNG file named "${fileName}" has been attached to this turn and is accessible to the sandbox.

Use Python to read the file's actual pixel bytes, then return the per-pixel matrix as JSON. Do not try to "look" at the image visually — use the code tool to read it.

Example:
  from PIL import Image
  img = Image.open("${fileName}").convert("RGBA")
  w, h = img.size           # both ${size}
  rows = []
  for y in range(h):
      row = []
      for x in range(w):
          r, g, b, a = img.getpixel((x, y))
          row.append(f"rgba({r},{g},{b},{a})")
      rows.append(row)
  import json
  print(json.dumps({"size": ${size}, "matrix": rows}))

After running your code, return ONLY this JSON object (no explanation, no markdown fence):
{
  "size": ${size},
  "matrix": [ [ "rgba(R,G,B,A)", ... ${size} ], ... ${size} ]
}

Row 0 is top, column 0 is leftmost. Use exact byte values 0..255 from img.getpixel — do not estimate.`
}

interface DirectResult {
  provider: ProviderName
  modelId: string
  ok: boolean
  elapsedMs: number
  text?: string
  usage?: Record<string, unknown>
  error?: string
}

async function callOpenAIDirect(
  modelId: string,
  prompt: string,
  imageBase64: string,
  detail: Args['detail'],
  maxOutput: number,
): Promise<DirectResult> {
  const client = new OpenAI()
  const started = performance.now()
  try {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${imageBase64}`, detail },
            },
          ],
        },
      ],
      max_completion_tokens: maxOutput,
    })
    const text = response.choices[0]?.message?.content ?? ''
    return {
      provider: 'openai',
      modelId,
      ok: true,
      elapsedMs: Math.round(performance.now() - started),
      text,
      usage: response.usage as unknown as Record<string, unknown>,
    }
  } catch (error: unknown) {
    return {
      provider: 'openai',
      modelId,
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function callOpenAICodeInterpreter(
  modelId: string,
  prompt: string,
  imagePath: string,
  maxOutput: number,
): Promise<DirectResult> {
  const client = new OpenAI()
  const started = performance.now()
  try {
    const file = await client.files.create({
      file: createReadStream(imagePath),
      purpose: 'assistants',
    })
    const response = await (client as unknown as {
      responses: {
        create: (req: Record<string, unknown>) => Promise<{
          output_text?: string
          output?: unknown[]
          usage?: unknown
        }>
      }
    }).responses.create({
      model: modelId,
      input: [
        {
          role: 'user',
          content: [{ type: 'input_text', text: prompt }],
        },
      ],
      tools: [
        {
          type: 'code_interpreter',
          container: { type: 'auto', file_ids: [file.id] },
        },
      ],
      max_output_tokens: maxOutput,
    })
    const text = response.output_text ?? extractOutputText(response.output)
    return {
      provider: 'openai',
      modelId,
      ok: true,
      elapsedMs: Math.round(performance.now() - started),
      text,
      usage: response.usage as Record<string, unknown> | undefined,
    }
  } catch (error: unknown) {
    return {
      provider: 'openai',
      modelId,
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function extractOutputText(output: unknown): string {
  if (!Array.isArray(output)) return ''
  const parts: string[] = []
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const obj = item as { type?: string; content?: unknown[] }
    if (obj.type !== 'message' || !Array.isArray(obj.content)) continue
    for (const piece of obj.content) {
      const p = piece as { type?: string; text?: string }
      if (p.type === 'output_text' && typeof p.text === 'string') parts.push(p.text)
    }
  }
  return parts.join('')
}

async function callOpenAICodeInterpreterInline(
  modelId: string,
  prompt: string,
  maxOutput: number,
): Promise<DirectResult> {
  const client = new OpenAI()
  const started = performance.now()
  try {
    const response = await (client as unknown as {
      responses: {
        create: (req: Record<string, unknown>) => Promise<{
          output_text?: string
          output?: unknown[]
          usage?: unknown
        }>
      }
    }).responses.create({
      model: modelId,
      input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
      tools: [{ type: 'code_interpreter', container: { type: 'auto' } }],
      max_output_tokens: maxOutput,
    })
    const text = response.output_text ?? extractOutputText(response.output)
    return {
      provider: 'openai',
      modelId,
      ok: true,
      elapsedMs: Math.round(performance.now() - started),
      text,
      usage: response.usage as Record<string, unknown> | undefined,
    }
  } catch (error: unknown) {
    return {
      provider: 'openai',
      modelId,
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function callAnthropicCodeExecutionInline(
  modelId: string,
  prompt: string,
  maxOutput: number,
): Promise<DirectResult> {
  const client = new Anthropic()
  const started = performance.now()
  try {
    const messagesApi = (client as unknown as {
      beta: {
        messages: {
          create: (req: Record<string, unknown>, opts?: { betas?: string[] }) => Promise<{
            content?: unknown[]
            usage?: unknown
          }>
        }
      }
    }).beta.messages
    const response = await messagesApi.create(
      {
        model: modelId,
        max_tokens: maxOutput,
        tools: [{ type: 'code_execution_20250522', name: 'code_execution' }],
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      },
      { betas: ['code-execution-2025-05-22'] },
    )
    const text = (response.content ?? [])
      .filter((b: unknown): b is { type: 'text'; text: string } => {
        return !!b && typeof b === 'object' && (b as { type?: string }).type === 'text'
      })
      .map((b) => b.text)
      .join('')
    return {
      provider: 'anthropic',
      modelId,
      ok: true,
      elapsedMs: Math.round(performance.now() - started),
      text,
      usage: response.usage as Record<string, unknown> | undefined,
    }
  } catch (error: unknown) {
    return {
      provider: 'anthropic',
      modelId,
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function uploadAnthropicFile(imagePath: string): Promise<string> {
  const fileBytes = await readFile(imagePath)
  const form = new FormData()
  form.append(
    'file',
    new Blob([new Uint8Array(fileBytes)], { type: 'image/png' }),
    path.basename(imagePath),
  )
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')
  const response = await fetch('https://api.anthropic.com/v1/files', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'files-api-2025-04-14',
    },
    body: form,
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`anthropic files upload failed: ${response.status} ${body}`)
  }
  const payload = (await response.json()) as { id?: string; type?: string }
  if (!payload.id) throw new Error(`anthropic files upload returned no id: ${JSON.stringify(payload)}`)
  return payload.id
}

async function callAnthropicCodeExecution(
  modelId: string,
  prompt: string,
  imagePath: string,
  maxOutput: number,
): Promise<DirectResult> {
  const client = new Anthropic()
  const started = performance.now()
  try {
    const fileId = await uploadAnthropicFile(imagePath)
    const messagesApi = (client as unknown as {
      beta: {
        messages: {
          create: (req: Record<string, unknown>, opts?: { betas?: string[] }) => Promise<{
            content?: unknown[]
            usage?: unknown
          }>
        }
      }
    }).beta.messages
    const response = await messagesApi.create(
      {
        model: modelId,
        max_tokens: maxOutput,
        tools: [{ type: 'code_execution_20250522', name: 'code_execution' }],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'container_upload', file_id: fileId },
            ],
          },
        ],
      },
      { betas: ['code-execution-2025-05-22', 'files-api-2025-04-14'] },
    )
    const text = (response.content ?? [])
      .filter((b: unknown): b is { type: 'text'; text: string } => {
        return !!b && typeof b === 'object' && (b as { type?: string }).type === 'text'
      })
      .map((b) => b.text)
      .join('')
    return {
      provider: 'anthropic',
      modelId,
      ok: true,
      elapsedMs: Math.round(performance.now() - started),
      text,
      usage: response.usage as Record<string, unknown> | undefined,
    }
  } catch (error: unknown) {
    return {
      provider: 'anthropic',
      modelId,
      ok: false,
      elapsedMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function callAnthropicDirect(
  modelId: string,
  prompt: string,
  imageBase64: string,
  maxOutput: number,
): Promise<DirectResult> {
  const client = new Anthropic()
  const started = performance.now()
  try {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: maxOutput,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: imageBase64 },
            },
          ],
        },
      ],
    })
    const text = response.content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block) => block.text)
      .join('')
    return {
      provider: 'anthropic',
      modelId,
      ok: true,
      elapsedMs: Math.round(performance.now() - started),
      text,
      usage: response.usage as unknown as Record<string, unknown>,
    }
  } catch (error: unknown) {
    return {
      provider: 'anthropic',
      modelId,
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
  console.log(`OpenAI image detail: ${args.detail}`)
  console.log('')

  const image = await readFile(imagePath)
  const imageBase64 = image.toString('base64')
  const imageFileName = path.basename(imagePath)
  const prompt = args.codeInterpreter
    ? args.inlineImage
      ? buildCodeInterpreterInlinePrompt(args.size, imageBase64)
      : buildCodeInterpreterPrompt(args.size, imageFileName)
    : buildPrompt(args.size)
  const modelSpecs = resolveModelSpecs(args)
  console.log(
    `Models under test (${modelSpecs.length}, via OFFICIAL SDKs${args.codeInterpreter ? ' + Code Interpreter' : ''}):`,
  )
  for (const spec of modelSpecs) console.log(`  - ${spec.provider}:${spec.modelId}`)
  console.log('')

  if (modelSpecs.some((s) => s.provider === 'openai') && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY missing')
  }
  if (modelSpecs.some((s) => s.provider === 'anthropic') && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY missing')
  }

  const summary: Array<{
    provider: ProviderName
    modelId: string
    score?: Score
    elapsedMs: number
    usage?: Record<string, unknown>
    error?: string
  }> = []

  for (const spec of modelSpecs) {
    const tag = args.codeInterpreter
      ? args.inlineImage
        ? 'direct SDK + Code Interpreter (inline base64)'
        : 'direct SDK + Code Interpreter (file upload)'
      : 'direct SDK'
    console.log(`Running ${spec.provider}/${spec.modelId} (${tag})...`)
    const result = args.codeInterpreter
      ? args.inlineImage
        ? spec.provider === 'openai'
          ? await callOpenAICodeInterpreterInline(spec.modelId, prompt, args.maxOutput)
          : await callAnthropicCodeExecutionInline(spec.modelId, prompt, args.maxOutput)
        : spec.provider === 'openai'
          ? await callOpenAICodeInterpreter(spec.modelId, prompt, imagePath, args.maxOutput)
          : await callAnthropicCodeExecution(spec.modelId, prompt, imagePath, args.maxOutput)
      : spec.provider === 'openai'
        ? await callOpenAIDirect(spec.modelId, prompt, imageBase64, args.detail, args.maxOutput)
        : await callAnthropicDirect(spec.modelId, prompt, imageBase64, args.maxOutput)

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
      console.log(
        `  ✗ matrix shape mismatch (expected ${args.size}x${args.size}, got ${predicted.length}x${predicted[0]?.length ?? 0})`,
      )
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

  console.log('=== Summary (DIRECT SDK) ===')
  console.log('provider                                              exact     within5    within20    within50   meanErr  maxErr')
  console.log('─────────────────────────────────────────────────  ───────  ──────────  ──────────  ──────────  ────────  ──────')
  for (const row of summary) {
    if (!row.score) {
      console.log(`${row.provider}/${row.modelId}: ${row.error ?? 'no matrix parsed'}`)
      continue
    }
    console.log(
      [
        `${row.provider}/${row.modelId}`.padEnd(48),
        `${row.score.exact}/${row.score.total}`.padStart(8),
        `${row.score.within5}/${row.score.total}`.padStart(10),
        `${row.score.within20}/${row.score.total}`.padStart(10),
        `${row.score.within50}/${row.score.total}`.padStart(10),
        String(row.score.meanError).padStart(8),
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
