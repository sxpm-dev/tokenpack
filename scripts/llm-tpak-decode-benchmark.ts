#!/usr/bin/env tsx
//
// Variant of llm-token-benchmark.ts that ships the same kind of PNG token but
// asks the LLM to recover the JSON from the `tpAK` ancillary chunk instead of
// from the pixel stream.
//
// Encoded with `pixel-range-deflate` (algorithm id 101), the pack data lives
// inside a private `tpAK` PNG chunk. The pixels are arbitrary decoration. The
// model receives the PNG attachment exactly like the existing benchmark, but
// the decode instructions tell it to walk PNG chunks, find tpAK, and inflate
// its body — no pixel decoding involved.

import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { encode } from '@tokenpack/node'
import { generateText } from 'ai'

loadDotenv()

function loadDotenv(): void {
  const envPath = path.resolve('.env')
  if (!existsSync(envPath)) return
  const loader = (process as unknown as { loadEnvFile?: (file: string) => void }).loadEnvFile
  if (typeof loader === 'function') loader.call(process, envPath)
}

type LanguageModel = Parameters<typeof generateText>[0]['model']
type ModelMessage = NonNullable<Parameters<typeof generateText>[0]['messages']>[number]
type ProviderName = 'openai' | 'anthropic'
type CallMode = 'raw-json' | 'token-image'

const TPAK_ALGO = 'pixel-range-deflate'

const TPAK_DECODE_INSTRUCTIONS = `The attached PNG is a @tokenpack/node compressed-data token using the \`pixel-range-deflate\` algorithm (algorithm id 101).

**Important:** unlike the previous token format, the pack data is NOT in the pixels. The pixels are arbitrary visual decoration. The pack data rides as a side channel in a private PNG ancillary chunk called \`tpAK\`. Decode by walking the PNG byte stream, not by sampling pixels.

Decode steps:

1. Read the PNG bytes (you have access to the attached file). The file starts with the PNG signature \`89 50 4E 47 0D 0A 1A 0A\` (8 bytes).
2. After the signature, the file is a sequence of chunks. Each chunk is:
   - length   : 4 bytes, big-endian u32 (length of \`data\` only)
   - type     : 4 bytes, ASCII (e.g. \`IHDR\`, \`IDAT\`, \`tpAK\`, \`IEND\`)
   - data     : \`length\` bytes
   - crc      : 4 bytes (CRC32 of type+data; ignore for decoding)
   Walk chunks until you find type = \`tpAK\` (ASCII \`74 70 41 4B\`). Skip everything else.
3. Read the \`tpAK\` chunk \`data\` bytes — call this T. T contains:
   - T[0..4]   : ASCII magic \`TPK1\` (hex \`54 50 4B 31\`)
   - T[4..6]   : algorithmId       — big-endian u16 (expected: 101)
   - T[6]      : compressionLevel  — u8 (expected: 4 → deflate level 9)
   - T[7..11]  : uncompressedLength — big-endian u32
   - T[11..]   : payload P
4. Decompress P with zlib/inflate (it is a zlib-wrapped DEFLATE stream). Output length MUST equal \`uncompressedLength\`.
5. If the decompressed bytes start with \`0xC0 0xDE 0xAE 0x54 0x01\`, parse the wrapped-file envelope:
   - bytes[0..4] = SIG \`0xC0 0xDE 0xAE 0x54\`
   - bytes[4]    = formatByte \`0x01\` (FORMAT_FILE)
   - bytes[5..7] = nameLen (little-endian u16)
   - next \`nameLen\` bytes = UTF-8 file name
   - rest = UTF-8 JSON payload
   If the signature is absent, treat all decompressed bytes as the JSON payload.
6. Parse the payload as UTF-8 JSON and answer the user's question from it.

**Honesty rules — extremely important:**

- If any step is impossible in your runtime (you cannot read PNG file bytes, you cannot run zlib, etc.), **do not guess and do not fabricate numbers.** Return numeric fields as \`null\`, set \`confidence\` to \`"low"\`, and use \`notes\` to record:
   1. The exact step that blocked you (e.g. "step 1: I can only see the rendered image, not the raw file bytes", "step 4: no zlib available").
   2. Any partial bytes you DID inspect (e.g. PNG signature hex, chunk types you saw, first 16 hex bytes of the tpAK body).
   3. Whether you'd succeed with a code interpreter / sandboxed Python.
- If you succeeded, include in \`notes\` the parsed header values: algorithmId, compressionLevel, uncompressedLength, and the extracted file name. This proves you actually decoded rather than pattern-matched the question.`

const RESPONSE_CONTRACT = `Return only a JSON object with this shape:
{
  "answer": <direct answer to the user's question>,
  "extractedValues": <object or array of the concrete values you found>,
  "evidence": [<short quotes, paths, or JSON locations that support the answer>],
  "confidence": "low" | "medium" | "high",
  "notes": [<important caveats, empty if none>]
}`

interface Args {
  jsonPath?: string
  question?: string
  questionFile?: string
  expectedPath?: string
  providers: ProviderName[]
  modes: CallMode[]
  out: string
  maxOutput: number
  temperature: number
  delayBetweenCallsMs: number
  thinkingBudgetTokens: number
  reasoningEffort: 'minimal' | 'low' | 'medium' | 'high'
  tokenName: string
  dryRun?: boolean
  help?: boolean
}

interface ProviderConfig {
  provider: ProviderName
  modelId: string
  model: LanguageModel
}

interface UsageSnapshot {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  reasoningTokens?: number
  cachedInputTokens?: number
  [key: string]: number | undefined
}

interface CallResult {
  provider: ProviderName
  model: string
  mode: CallMode
  ok: boolean
  elapsedMs: number
  finishReason?: string
  usage?: UsageSnapshot
  totalUsage?: UsageSnapshot
  providerMetadata?: Record<string, Record<string, unknown>>
  responseId?: string
  promptChars: number
  promptBytes: number
  imageBytes: number
  text?: string
  error?: string
  expectedScore?: ExpectedScore
}

interface ExpectedFieldResult {
  expected: number | string | boolean | null
  found?: unknown
  ok: boolean
}

interface ExpectedScore {
  fields: Record<string, ExpectedFieldResult>
  matches: number
  total: number
  ok: boolean
}

function usage(): string {
  return `Usage:
  yarn bench:llm-tpak --json ./big.json --question "..."
  yarn bench:llm-tpak --json ./big.json --question-file ./question.txt --modes token-image,raw-json

What this does:
  1. Re-encodes <json> with @tokenpack/node algo=${TPAK_ALGO}
     (pack data lives in the PNG \`tpAK\` ancillary chunk; pixels are decoration).
  2. Sends the PNG to the LLM as an image attachment — same as llm-token-benchmark.
  3. Decode instructions tell the LLM to walk PNG chunks, find tpAK, and inflate it
     (instead of decoding the pixel stream).
  4. Optionally also runs a raw-json baseline so the report shows both side-by-side.

Required env:
  OPENAI_API_KEY     for providers including openai
  ANTHROPIC_API_KEY  for providers including anthropic

Optional env:
  OPENAI_MODEL       default: gpt-5.4-mini
  ANTHROPIC_MODEL    default: claude-sonnet-4-5-20250929

Options:
  --json <path>            JSON document to encode + question against.
  --question <text>        Question to ask. Use --question-file to read from disk.
  --question-file <path>
  --expected <path>        Expected-answer JSON for scoring.
                           Defaults to <json-dir>/expected-answer.json when present.
  --providers <list>       openai,anthropic by default.
  --modes <list>           token-image,raw-json by default. Set to "token-image" to skip baseline.
  --token-name <string>    Name embedded in the wrapped-file envelope. Default: basename of --json.
  --out <dir>              Output directory. Default: ./tmp/llm-tpak-benchmark
  --max-output <n>         Default: 8000
  --temperature <n>        Default: 0
  --delay-between-calls <ms>  Default: 0
  --thinking <budget>      Enable Anthropic extended thinking. Default: 0 (off).
  --reasoning-effort <level>  OpenAI: minimal|low|medium|high. Default: medium.
  --dry-run                Skip API calls; print plan + artifact sizes.
  --help                   Show this help.
`
}

function parseModesList(value: string): CallMode[] {
  const tokens = value.split(',').map((entry) => entry.trim()).filter(Boolean)
  const allowed: CallMode[] = ['raw-json', 'token-image']
  for (const token of tokens) {
    if (!allowed.includes(token as CallMode)) {
      throw new Error(`Unsupported --modes value: ${token}. Expected: ${allowed.join('|')}`)
    }
  }
  if (tokens.length === 0) throw new Error('--modes cannot be empty')
  return tokens as CallMode[]
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    providers: ['openai', 'anthropic'],
    modes: ['raw-json', 'token-image'],
    out: path.resolve('tmp/llm-tpak-benchmark'),
    maxOutput: 8000,
    temperature: 0,
    delayBetweenCallsMs: 0,
    thinkingBudgetTokens: 0,
    reasoningEffort: 'medium',
    tokenName: '',
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    const next = (): string => {
      const value = argv[++i]
      if (!value) throw new Error(`Missing value for ${arg}`)
      return value
    }
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--json') args.jsonPath = path.resolve(next())
    else if (arg === '--question') args.question = next()
    else if (arg === '--question-file') args.questionFile = path.resolve(next())
    else if (arg === '--expected') args.expectedPath = path.resolve(next())
    else if (arg === '--providers') {
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
    } else if (arg === '--modes') args.modes = parseModesList(next())
    else if (arg === '--token-name') args.tokenName = next()
    else if (arg === '--out') args.out = path.resolve(next())
    else if (arg === '--max-output') args.maxOutput = Number(next())
    else if (arg === '--temperature') args.temperature = Number(next())
    else if (arg === '--delay-between-calls') args.delayBetweenCallsMs = Number(next())
    else if (arg === '--thinking') args.thinkingBudgetTokens = Number(next())
    else if (arg === '--reasoning-effort') {
      const value = next()
      if (value !== 'minimal' && value !== 'low' && value !== 'medium' && value !== 'high') {
        throw new Error(`--reasoning-effort must be minimal|low|medium|high, got ${value}`)
      }
      args.reasoningEffort = value
    } else if (arg === '--dry-run') args.dryRun = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function requireFile(filePath: string | undefined, label: string): asserts filePath is string {
  if (!filePath) throw new Error(`Missing ${label}`)
  if (!existsSync(filePath)) throw new Error(`${label} does not exist: ${filePath}`)
}

function defaultModelId(provider: ProviderName): string {
  if (provider === 'openai') return process.env.OPENAI_MODEL ?? 'gpt-5.4-mini'
  return process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929'
}

function makeProvider(name: ProviderName): ProviderConfig {
  if (name === 'openai') {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required for provider openai')
    const modelId = defaultModelId('openai')
    return { provider: name, modelId, model: openai(modelId) }
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY required for provider anthropic')
  }
  const modelId = defaultModelId('anthropic')
  return { provider: name, modelId, model: anthropic(modelId) }
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

interface TpakInspection {
  algorithmId: number
  compressionLevel: number
  uncompressedLength: number
  payloadBytes: number
  chunkBodyBytes: number
  chunkFileOffset: number
}

function inspectTpakChunkInPng(pngBytes: Buffer): TpakInspection {
  if (pngBytes.length < 8 || !pngBytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Not a PNG (missing 8-byte signature)')
  }
  let pos = 8
  while (pos + 8 <= pngBytes.length) {
    const length = pngBytes.readUInt32BE(pos)
    const type = pngBytes.subarray(pos + 4, pos + 8).toString('ascii')
    const dataStart = pos + 8
    const dataEnd = dataStart + length
    if (type === 'tpAK') {
      const body = pngBytes.subarray(dataStart, dataEnd)
      if (body.length < 11 || body.subarray(0, 4).toString('ascii') !== 'TPK1') {
        throw new Error('tpAK chunk found but body is missing TPK1 header')
      }
      return {
        algorithmId: body.readUInt16BE(4),
        compressionLevel: body.readUInt8(6),
        uncompressedLength: body.readUInt32BE(7),
        payloadBytes: body.length - 11,
        chunkBodyBytes: body.length,
        chunkFileOffset: dataStart,
      }
    }
    if (type === 'IEND') break
    pos = dataEnd + 4
  }
  throw new Error('No tpAK chunk found in PNG — was it encoded with pixel-range-*?')
}

function rawJsonPrompt(jsonText: string, question: string): string {
  return `You are analyzing the JSON document below.

Question:
${question}

${RESPONSE_CONTRACT}

JSON document:
${jsonText}`
}

function tokenImagePrompt(question: string): string {
  return `${TPAK_DECODE_INSTRUCTIONS}

Question:
${question}

${RESPONSE_CONTRACT}`
}

function coerceUsage(raw: unknown): UsageSnapshot | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const flat: UsageSnapshot = {}
  const stack: Array<{ value: Record<string, unknown>; prefix: string }> = [
    { value: raw as Record<string, unknown>, prefix: '' },
  ]
  while (stack.length) {
    const { value, prefix } = stack.pop()!
    for (const [key, v] of Object.entries(value)) {
      const dotPath = prefix ? `${prefix}.${key}` : key
      if (typeof v === 'number') flat[dotPath] = v
      else if (v && typeof v === 'object' && !Array.isArray(v)) {
        stack.push({ value: v as Record<string, unknown>, prefix: dotPath })
      }
    }
  }
  return Object.keys(flat).length ? flat : undefined
}

function coerceProviderMetadata(raw: unknown): Record<string, Record<string, unknown>> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: Record<string, Record<string, unknown>> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value && typeof value === 'object') out[key] = value as Record<string, unknown>
  }
  return Object.keys(out).length ? out : undefined
}

interface RunCallArgs {
  providerConfig: ProviderConfig
  mode: CallMode
  messages: ModelMessage[]
  promptText: string
  imageBytes: number
  maxOutput: number
  temperature: number
  thinkingBudgetTokens: number
  reasoningEffort: Args['reasoningEffort']
}

async function runCall({
  providerConfig,
  mode,
  messages,
  promptText,
  imageBytes,
  maxOutput,
  temperature,
  thinkingBudgetTokens,
  reasoningEffort,
}: RunCallArgs): Promise<CallResult> {
  const startedAt = performance.now()
  const promptChars = promptText.length
  const promptBytes = Buffer.byteLength(promptText, 'utf8')
  const providerOptions: Record<string, Record<string, unknown>> = {}
  let effectiveTemperature: number | undefined = temperature
  if (providerConfig.provider === 'anthropic' && thinkingBudgetTokens > 0) {
    providerOptions.anthropic = {
      thinking: { type: 'enabled', budgetTokens: thinkingBudgetTokens },
    }
    effectiveTemperature = 1
  }
  if (providerConfig.provider === 'openai') {
    providerOptions.openai = { reasoningEffort }
    effectiveTemperature = undefined
  }
  try {
    const generateOptions: Parameters<typeof generateText>[0] = {
      model: providerConfig.model,
      messages,
      maxOutputTokens: maxOutput,
    }
    if (effectiveTemperature !== undefined) {
      ;(generateOptions as { temperature?: number }).temperature = effectiveTemperature
    }
    if (Object.keys(providerOptions).length > 0) {
      ;(generateOptions as { providerOptions?: typeof providerOptions }).providerOptions =
        providerOptions
    }
    const result = (await generateText(generateOptions)) as unknown as {
      finishReason?: string
      text?: string
      usage?: unknown
      totalUsage?: unknown
      providerMetadata?: unknown
      response?: { id?: string }
    }
    return {
      provider: providerConfig.provider,
      model: providerConfig.modelId,
      mode,
      ok: true,
      elapsedMs: Math.round(performance.now() - startedAt),
      finishReason: result.finishReason,
      usage: coerceUsage(result.usage),
      totalUsage: coerceUsage(result.totalUsage ?? result.usage),
      providerMetadata: coerceProviderMetadata(result.providerMetadata),
      responseId: result.response?.id,
      promptChars,
      promptBytes,
      imageBytes,
      text: result.text,
    }
  } catch (error: unknown) {
    return {
      provider: providerConfig.provider,
      model: providerConfig.modelId,
      mode,
      ok: false,
      elapsedMs: Math.round(performance.now() - startedAt),
      promptChars,
      promptBytes,
      imageBytes,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function extractJson(text: string | undefined): unknown | null {
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1]!.trim() : text.trim()
  try {
    return JSON.parse(candidate)
  } catch {
    const first = candidate.indexOf('{')
    const last = candidate.lastIndexOf('}')
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(candidate.slice(first, last + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

function collectScoredLeaves(
  value: unknown,
  into: Record<string, ExpectedFieldResult['expected']>,
  prefix = '',
): void {
  if (value === null || typeof value !== 'object') return
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (raw === null || ['number', 'string', 'boolean'].includes(typeof raw)) {
      into[prefix ? `${prefix}.${key}` : key] = raw as ExpectedFieldResult['expected']
    } else if (typeof raw === 'object') {
      collectScoredLeaves(raw, into, prefix ? `${prefix}.${key}` : key)
    }
  }
}

function findValueByKey(value: unknown, key: string): unknown {
  if (value === null || value === undefined) return undefined
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValueByKey(item, key)
      if (found !== undefined) return found
    }
    return undefined
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (key in record) return record[key]
    for (const child of Object.values(record)) {
      const found = findValueByKey(child, key)
      if (found !== undefined) return found
    }
  }
  return undefined
}

function valuesEqual(expected: ExpectedFieldResult['expected'], found: unknown): boolean {
  if (expected === null) return found === null
  if (typeof expected === 'number') {
    if (typeof found !== 'number') return false
    if (!Number.isFinite(expected) || !Number.isFinite(found)) return expected === found
    const tolerance = Math.max(0.01, Math.abs(expected) * 0.001)
    return Math.abs(expected - found) <= tolerance
  }
  return expected === found
}

function scoreAnswer(llmJson: unknown, expected: unknown): ExpectedScore {
  const flat: Record<string, ExpectedFieldResult['expected']> = {}
  collectScoredLeaves(expected, flat)
  const fields: Record<string, ExpectedFieldResult> = {}
  let matches = 0
  let total = 0
  for (const [keyPath, expectedValue] of Object.entries(flat)) {
    const lastKey = keyPath.split('.').pop()!
    const foundDeep = findValueByKey(llmJson, lastKey)
    const ok = valuesEqual(expectedValue, foundDeep ?? null)
    fields[keyPath] = {
      expected: expectedValue,
      found: foundDeep === undefined ? undefined : foundDeep,
      ok,
    }
    total += 1
    if (ok) matches += 1
  }
  return { fields, matches, total, ok: total > 0 && matches === total }
}

function scoreCallAnswer(result: CallResult, expected: unknown): void {
  if (!result.ok || !result.text) return
  const parsed = extractJson(result.text)
  if (parsed === null) return
  result.expectedScore = scoreAnswer(parsed, expected)
}

function paidTokens(result: CallResult): number | undefined {
  const u = result.totalUsage ?? result.usage
  if (!u) return undefined
  if (typeof u.totalTokens === 'number') return u.totalTokens
  const input = u.inputTokens ?? 0
  const output = u.outputTokens ?? 0
  const reasoning = u.reasoningTokens ?? 0
  return input + output + reasoning
}

function summarizeUsage(result: CallResult): string {
  const u = result.totalUsage ?? result.usage
  if (!u) return 'usage=n/a'
  const parts: string[] = []
  if (typeof u.inputTokens === 'number') parts.push(`in=${u.inputTokens}`)
  if (typeof u.outputTokens === 'number') parts.push(`out=${u.outputTokens}`)
  if (typeof u.reasoningTokens === 'number') parts.push(`reason=${u.reasoningTokens}`)
  if (typeof u.cachedInputTokens === 'number') parts.push(`cached=${u.cachedInputTokens}`)
  if (typeof u.totalTokens === 'number') parts.push(`total=${u.totalTokens}`)
  return parts.length ? parts.join(' ') : 'usage=n/a'
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function fmtNum(value: number | undefined): string {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString('en-US')
}

type TableCell = string | number | undefined | null

function renderTextTable(headers: string[], rows: TableCell[][]): string {
  const allRows = [
    headers,
    ...rows.map((row) => row.map((cell) => (cell == null ? '—' : String(cell)))),
  ]
  const widths = headers.map((_, idx) =>
    allRows.reduce((max, row) => Math.max(max, (row[idx] ?? '').length), 0),
  )
  const pad = (row: string[]): string =>
    row.map((cell, idx) => (idx === 0 ? cell.padEnd(widths[idx]!) : cell.padStart(widths[idx]!))).join('  ')
  const separator = widths.map((w) => '─'.repeat(w)).join('  ')
  return [pad(allRows[0] as string[]), separator, ...allRows.slice(1).map((row) => pad(row as string[]))].join('\n')
}

function renderMarkdownTable(headers: string[], rows: TableCell[][]): string {
  const headerLine = `| ${headers.join(' | ')} |`
  const sepLine = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows
    .map((row) => `| ${row.map((cell) => (cell == null ? '—' : String(cell))).join(' | ')} |`)
    .join('\n')
  return [headerLine, sepLine, body].join('\n')
}

function buildResultRows(results: CallResult[]): TableCell[][] {
  return results.map((result) => [
    result.provider,
    result.mode,
    result.ok ? 'ok' : 'fail',
    fmtNum(paidTokens(result)),
    fmtNum(result.totalUsage?.inputTokens ?? result.usage?.inputTokens),
    fmtNum(result.totalUsage?.outputTokens ?? result.usage?.outputTokens),
    fmtBytes(result.promptBytes),
    fmtBytes(result.imageBytes),
    `${result.elapsedMs} ms`,
    result.expectedScore ? `${result.expectedScore.matches}/${result.expectedScore.total}` : '—',
  ])
}

function indent(text: string, prefix = '    '): string {
  return text.split('\n').map((line) => `${prefix}${line}`).join('\n')
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined) return String(value)
  if (typeof value === 'number') return value.toLocaleString('en-US')
  if (typeof value === 'object') {
    const json = JSON.stringify(value)
    return json.length > 120 ? `${json.slice(0, 117)}…` : json
  }
  return String(value)
}

function renderAnswerSection(results: CallResult[], expected: unknown, mode: CallMode): string {
  const lines: string[] = []
  lines.push(`Expected:`)
  const flatExpected: Record<string, ExpectedFieldResult['expected']> = {}
  collectScoredLeaves(expected, flatExpected)
  for (const [key, value] of Object.entries(flatExpected)) {
    lines.push(`  ${key}: ${formatScalar(value)}`)
  }
  lines.push('')

  const calls = results.filter((r) => r.mode === mode)
  for (const result of calls) {
    lines.push(`${result.provider} / ${mode}:`)
    if (!result.ok) {
      lines.push(`  ✗ call failed: ${result.error ?? 'unknown error'}`)
      lines.push('')
      continue
    }
    if (result.expectedScore) {
      for (const [keyPath, field] of Object.entries(result.expectedScore.fields)) {
        const marker = field.ok ? '✓' : '✗'
        const found = field.found === undefined ? 'missing' : formatScalar(field.found)
        const exp = formatScalar(field.expected)
        lines.push(`  ${marker} ${keyPath}: got ${found}` + (field.ok ? '' : ` (expected ${exp})`))
      }
      const { matches, total, ok } = result.expectedScore
      lines.push(`  → match ${matches}/${total} ${ok ? '✓ PASS' : '✗ FAIL'}`)
    } else {
      lines.push('  (response was not parseable JSON — showing raw text below)')
    }
    if (result.text) {
      lines.push('')
      lines.push('  Model said (verbatim):')
      lines.push(indent(result.text, '    '))
    }
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function resolveExpectedPath(
  explicit: string | undefined,
  jsonPath: string,
): Promise<string | undefined> {
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`--expected does not exist: ${explicit}`)
    return explicit
  }
  const candidate = path.join(path.dirname(jsonPath), 'expected-answer.json')
  return existsSync(candidate) ? candidate : undefined
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(usage())
    return
  }

  if (args.thinkingBudgetTokens > 0 && args.maxOutput <= args.thinkingBudgetTokens) {
    args.maxOutput = args.thinkingBudgetTokens + 2000
  }

  requireFile(args.jsonPath, '--json file')
  if (!args.question && !args.questionFile) {
    throw new Error('Missing --question or --question-file')
  }

  const question = args.question ?? (await readFile(args.questionFile!, 'utf8')).trim()
  const jsonText = await readFile(args.jsonPath, 'utf8')
  try {
    JSON.parse(jsonText)
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`--json is not valid JSON (${reason}): ${args.jsonPath}`)
  }
  const tokenName = args.tokenName || path.basename(args.jsonPath)

  const resolvedExpectedPath = await resolveExpectedPath(args.expectedPath, args.jsonPath)
  const expectedAnswer = resolvedExpectedPath
    ? (JSON.parse(await readFile(resolvedExpectedPath, 'utf8')) as unknown)
    : undefined

  const jsonBuffer = Buffer.from(jsonText, 'utf8')
  const tokenImage = await encode(jsonBuffer, { algo: TPAK_ALGO, name: tokenName })
  const inspection = inspectTpakChunkInPng(tokenImage)

  await mkdir(args.out, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const runDir = path.join(args.out, timestamp)
  await mkdir(runDir, { recursive: true })
  const tokenPath = path.join(runDir, 'token.png')
  await writeFile(tokenPath, tokenImage)

  const metadata = {
    startedAt: new Date().toISOString(),
    jsonPath: args.jsonPath,
    jsonBytes: jsonBuffer.byteLength,
    tokenPath,
    tokenName,
    algo: TPAK_ALGO,
    tokenPngBytes: tokenImage.byteLength,
    tpakInspection: inspection,
    expectedPath: resolvedExpectedPath,
    question,
    providers: args.providers.map((provider) => ({ provider, model: defaultModelId(provider) })),
    modes: args.modes,
    maxOutput: args.maxOutput,
    temperature: args.temperature,
  }
  await writeFile(path.join(runDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

  console.log(`Source JSON         : ${args.jsonPath}`)
  console.log(`  bytes             : ${jsonBuffer.byteLength}`)
  console.log(`Encoded PNG token   : ${tokenImage.byteLength} bytes (algo=${TPAK_ALGO})`)
  console.log(`  written to        : ${tokenPath}`)
  console.log(`tpAK chunk inside PNG:`)
  console.log(`  algorithmId       : ${inspection.algorithmId}`)
  console.log(`  compressionLevel  : ${inspection.compressionLevel}`)
  console.log(`  uncompressedLength: ${inspection.uncompressedLength}`)
  console.log(`  chunk body bytes  : ${inspection.chunkBodyBytes}`)
  console.log(`  payload bytes     : ${inspection.payloadBytes}`)
  console.log(`  file offset       : ${inspection.chunkFileOffset}`)
  console.log('')

  if (args.dryRun) {
    console.log('Dry run: no API requests sent.')
    console.log(`Planned calls: ${args.providers.length * args.modes.length}`)
    console.log(`Wrote ${path.join(runDir, 'metadata.json')}`)
    return
  }

  const providers = args.providers.map(makeProvider)
  const results: CallResult[] = []
  for (const providerConfig of providers) {
    for (const mode of args.modes) {
      if (results.length > 0 && args.delayBetweenCallsMs > 0) {
        await sleep(args.delayBetweenCallsMs)
      }
      let promptText: string
      let messages: ModelMessage[]
      let imageBytes = 0
      if (mode === 'raw-json') {
        promptText = rawJsonPrompt(jsonText, question)
        messages = [{ role: 'user', content: promptText }]
      } else {
        promptText = tokenImagePrompt(question)
        imageBytes = tokenImage.byteLength
        messages = [
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image', image: tokenImage, mediaType: 'image/png' },
            ],
          },
        ]
      }

      console.log(`Running ${providerConfig.provider}/${providerConfig.modelId} ${mode}...`)
      const callResult = await runCall({
        providerConfig,
        mode,
        messages,
        promptText,
        imageBytes,
        maxOutput: args.maxOutput,
        temperature: args.temperature,
        thinkingBudgetTokens: args.thinkingBudgetTokens,
        reasoningEffort: args.reasoningEffort,
      })
      if (expectedAnswer !== undefined) scoreCallAnswer(callResult, expectedAnswer)
      results.push(callResult)
      const matchSuffix = callResult.expectedScore
        ? ` match=${callResult.expectedScore.matches}/${callResult.expectedScore.total}`
        : ''
      console.log(
        `  ${callResult.ok ? 'ok' : 'failed'} ${callResult.elapsedMs}ms ${summarizeUsage(callResult)}${matchSuffix}`,
      )
    }
  }

  const headers = [
    'provider',
    'mode',
    'status',
    'paid tok',
    'in tok',
    'out tok',
    'prompt',
    'image',
    'elapsed',
    'match',
  ]
  const rows = buildResultRows(results)
  const textTable = renderTextTable(headers, rows)
  const markdownTable = renderMarkdownTable(headers, rows)
  const tokenAnswers = expectedAnswer !== undefined && args.modes.includes('token-image')
    ? renderAnswerSection(results, expectedAnswer, 'token-image')
    : ''
  const rawAnswers = expectedAnswer !== undefined && args.modes.includes('raw-json')
    ? renderAnswerSection(results, expectedAnswer, 'raw-json')
    : ''

  const tokenResults = results.filter((r) => r.mode === 'token-image')
  const overallPass =
    tokenResults.length > 0 && tokenResults.every((r) => r.expectedScore?.ok === true)

  const report = {
    metadata,
    results,
    expectedAnswer,
    overallPass,
    completedAt: new Date().toISOString(),
  }
  await writeFile(path.join(runDir, 'report.json'), JSON.stringify(report, null, 2))
  await writeFile(
    path.join(runDir, 'summary.md'),
    [
      '# LLM tpAK Decode Benchmark',
      '',
      '**Hypothesis:** the LLM cannot recover bytes from rendered PNG pixels, but maybe it can',
      'walk the PNG byte stream, find the `tpAK` ancillary chunk, and decode the bytes inside.',
      `The token is encoded with \`${TPAK_ALGO}\` so the pack data lives in tpAK; pixels are decoration.`,
      '',
      `**Overall:** ${overallPass ? '✓ PASS' : '✗ FAIL'} on token-image vs expected.`,
      '',
      '## Per-call usage',
      '',
      markdownTable,
      '',
      ...(tokenAnswers ? ['## token-image answers (the test)', '', '```', tokenAnswers, '```', ''] : []),
      ...(rawAnswers ? ['## raw-json answers (baseline)', '', '```', rawAnswers, '```', ''] : []),
      '## Calls',
      '',
      ...results.map((result) =>
        [
          `### ${result.provider} / ${result.model} / ${result.mode}`,
          '',
          `Status: ${result.ok ? 'ok' : 'failed'}`,
          `Elapsed: ${result.elapsedMs}ms`,
          `Prompt bytes: ${result.promptBytes} (chars: ${result.promptChars})`,
          `Image bytes: ${result.imageBytes}`,
          `Usage: ${summarizeUsage(result)}`,
          result.finishReason ? `Finish reason: ${result.finishReason}` : '',
          result.error ? `Error: ${result.error}` : '',
          '',
          '```text',
          result.text ?? '',
          '```',
          '',
        ]
          .filter(Boolean)
          .join('\n'),
      ),
    ].join('\n'),
  )

  console.log('')
  console.log(`Wrote ${path.join(runDir, 'report.json')}`)
  console.log(`Wrote ${path.join(runDir, 'summary.md')}`)
  console.log('')
  console.log('=== Usage table ===')
  console.log(textTable)
  console.log('')
  if (tokenAnswers) {
    console.log('=== token-image answers (the test) ===')
    console.log(tokenAnswers)
    console.log('')
  }
  console.log(`Overall: ${overallPass ? '✓ PASS' : '✗ FAIL'}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  console.error('')
  console.error(usage())
  process.exitCode = 1
})
