#!/usr/bin/env tsx

import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { decode } from '@tokenpack/node'
import { generateText } from 'ai'

loadDotenv()

function loadDotenv(): void {
  const envPath = path.resolve('.env')
  if (!existsSync(envPath)) return
  const loader = (process as unknown as { loadEnvFile?: (file: string) => void }).loadEnvFile
  if (typeof loader === 'function') {
    loader.call(process, envPath)
  }
}

type LanguageModel = Parameters<typeof generateText>[0]['model']
type ModelMessage = NonNullable<Parameters<typeof generateText>[0]['messages']>[number]

const DEFAULT_DECODE_INSTRUCTIONS = `The attached PNG is a @tokenpack/node compressed-data token using the \`linear-deflate\` algorithm.

Decode the image to recover the embedded UTF-8 JSON document before answering:

1. Decode the PNG losslessly into its raw RGB pixel grid. Ignore container metadata, color profiles, gamma, EXIF, and any non-pixel chunks.
2. Concatenate the raw RGB pixel bytes left-to-right, top-to-bottom, channel order R,G,B per pixel. Drop the alpha channel if any. Call this stream P.
3. Inspect the header at the very start of P:
   - If P[0] = 0xC0, P[1] = 0xDE, P[2] = 0xAE, P[3] = 0x54, it is a FULL header (30 bytes / 10 pixels).
     - algorithmId      = P[5]
     - fileLength       = P[6..9]   big-endian u32  (size in bytes of the data region that follows the header)
     - compressionLevel = P[15]     (see step 5 for the family + level decoding)
     - uncompressedLength = P[16..19] big-endian u32
     - dataPixelCount   = P[21..24] big-endian u32
     - channels         = P[25]
     - Header occupies bytes [0..30); data region starts at byte 30.
   - Else if P[0] = 0xC1, it is a COMPACT header (6 bytes / 2 pixels).
     - algoId      = P[1]
     - flags       = P[2]            (bit 1 = compressed; bits 3-2 encode channels)
     - dataLength  = (P[3]<<16) | (P[4]<<8) | P[5]
     - Header occupies bytes [0..6); data region starts at byte 6.
4. Take the next \`fileLength\` (or \`dataLength\`) bytes after the header — call this stream D.
5. Map compressionLevel (full header) to a compressor family and decompress D:
     0 → none           (no decompression)
     1 → deflate, level 6   (zlib raw/wrapped DEFLATE)
     2 → brotli,  quality 11
     3 → deflate, level 1
     4 → deflate, level 9   ← this fixture uses this value
     5 → brotli,  quality 4
     6 → brotli,  quality 6
   The default fixture is encoded with \`linear-deflate\` → compressionLevel = 4 → standard zlib/DEFLATE decompression.
   For the compact header, the same mapping applies (bit 1 set means "compressed"; level is implementation-defined — try DEFLATE first since this fixture is \`linear-deflate\`).
   Call the decompressed bytes W.
6. W is a wrapped-file envelope when its first 4 bytes are 0xC0 0xDE 0xAE 0x54 followed by 0x01:
   - SIG          = W[0..4] = 0xC0,0xDE,0xAE,0x54
   - formatByte   = W[4]    = 0x01     (FORMAT_FILE)
   - nameLen      = W[5..7] little-endian u16
   - name         = next nameLen UTF-8 bytes
   - payload      = the rest of W
   The payload is the UTF-8 JSON document.
   If W does not start with that signature, treat all of W as the payload.
7. Parse the payload as UTF-8 JSON and use it as the data source for the user's question.

Do not print full extracted files unless the question explicitly asks for them.

**Honesty rules — extremely important:**

- If any decoding step fails or is impossible in your current execution environment (e.g. you cannot losslessly decode the PNG to pixels, cannot run DEFLATE, cannot read the byte stream), **do not guess and do not fabricate numeric answers**. Return numeric fields as \`null\`, set \`confidence\` to \`"low"\`, and use the \`notes\` array to record:
   1. The exact step that blocked you (e.g. "step 1: I cannot losslessly decode PNG → RGB in this environment", "step 5: I do not have a DEFLATE implementation available").
   2. Any partial bytes you *were* able to inspect (first 16 bytes of P as hex, header field values you parsed, etc.).
   3. Whether you would be able to do this with tools like a code interpreter / sandboxed Python.
- If you successfully decoded, include in \`notes\` the parsed header values: format (\`full\`/\`compact\`), algorithmId, compressionLevel, fileLength, uncompressedLength, and the extracted file name. This proves you actually decoded rather than pattern-matched the question.`

const RESPONSE_CONTRACT = `Return only a JSON object with this shape:
{
  "answer": <direct answer to the user's question>,
  "extractedValues": <object or array of the concrete values you found>,
  "evidence": [<short quotes, paths, or JSON locations that support the answer>],
  "confidence": "low" | "medium" | "high",
  "notes": [<important caveats, empty if none>]
}`

type ProviderName = 'openai' | 'anthropic'

interface Args {
  jsonPath?: string
  tokenPath?: string
  question?: string
  questionFile?: string
  expectedPath?: string
  providers: ProviderName[]
  out: string
  maxOutput: number
  temperature: number
  delayBetweenCallsMs: number
  thinkingBudgetTokens: number
  reasoningEffort: 'minimal' | 'low' | 'medium' | 'high'
  decodeInstructionsPath?: string
  dryRun?: boolean
  help?: boolean
}

interface ProviderConfig {
  provider: ProviderName
  modelId: string
  model: LanguageModel
}

interface DryProviderConfig {
  provider: ProviderName
  modelId: string
}

type ResolvedProvider = ProviderConfig | DryProviderConfig

type CallMode = 'raw-json' | 'token-image'

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
  /** Per-step usage (single-step for generateText without tools). */
  usage?: UsageSnapshot
  /** Aggregated usage across steps; same shape as `usage`. */
  totalUsage?: UsageSnapshot
  /** Provider-specific cache/image/reasoning counters surfaced by the SDK. */
  providerMetadata?: Record<string, Record<string, unknown>>
  responseId?: string
  responseModelId?: string
  stepsCount?: number
  promptChars: number
  promptBytes: number
  imageBytes: number
  text?: string
  warnings?: unknown[]
  error?: string
  /** Score of the LLM answer against the --expected fixture (when supplied). */
  expectedScore?: ExpectedScore
}

type UsageTotals = Record<string, number>

interface AggregatedUsage {
  perCall: Array<{ provider: ProviderName; mode: CallMode; usage: UsageTotals }>
  perProvider: Record<string, UsageTotals>
  perMode: Record<string, UsageTotals>
  perProviderMode: Record<string, UsageTotals>
  grandTotal: UsageTotals
  inputBytes: {
    perCall: Array<{ provider: ProviderName; mode: CallMode; promptBytes: number; imageBytes: number }>
    grandTotalPromptBytes: number
    grandTotalImageBytes: number
  }
  efficiency: Array<{
    provider: ProviderName
    mode: CallMode
    promptBytes: number
    imageBytes: number
    inputTokens?: number
    bytesPerInputToken?: number
  }>
}

interface ParsedJsonOk {
  ok: true
  value: unknown
}

interface ParsedJsonErr {
  ok: false
  reason: string
}

type ParsedJson = ParsedJsonOk | ParsedJsonErr

interface ValidationResult {
  ok: boolean
  reason?: string
  kind?: 'json' | 'text'
  rawParseable?: boolean
  tokenParseable?: boolean
  rawParseReason?: string
  tokenParseReason?: string
  rawComparable?: unknown
  tokenComparable?: unknown
  tokenDecodeMatchedJson?: boolean
}

function usage(): string {
  return `Usage:
  yarn bench:llm-token --json ./big.json --token ./token.png --question "Extract X and group by Y"
  yarn bench:llm-token --json ./big.json --token ./token.png --question-file ./question.txt --providers openai,anthropic

Required env:
  OPENAI_API_KEY       for --providers openai
  ANTHROPIC_API_KEY    for --providers anthropic

Optional env:
  OPENAI_MODEL         default: gpt-5.4-mini
  ANTHROPIC_MODEL      default: claude-sonnet-4-5-20250929

Options:
  --json <path>              Raw JSON file for the baseline text request.
  --token <path>             PNG token image for the compressed-image request.
  --question <text>          Question to ask both requests.
  --question-file <path>     Read the question from a file.
  --providers <list>         openai,anthropic by default.
  --out <dir>                Output directory. Default: ./tmp/llm-token-benchmark
  --max-output <number>      Max output tokens per call. Default: 8000
  --temperature <number>     Default: 0
  --delay-between-calls <ms> Sleep between successive API calls.
                             Default: 0. Use e.g. 60000 to respect Anthropic's
                             30K input-tokens-per-minute org limit.
  --thinking <budget>        Enable Anthropic extended thinking with the given
                             token budget (e.g. 20000). Default: 0 (off).
                             Applies only to anthropic provider; OpenAI uses
                             --reasoning-effort instead.
  --reasoning-effort <level> OpenAI reasoning-model effort: minimal|low|medium|high.
                             Default: medium. Use "high" to give reasoning models
                             a real budget for byte-level decoding tasks.
  --decode-instructions <path>
                             Override the image-token decode instructions.
  --expected <path>          Expected-answer JSON (numeric fields scored deeply).
                             Defaults to <json-dir>/expected-answer.json when present.
  --dry-run                  Validate inputs and print planned calls without API requests.
  --help                     Show this help.
`
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    providers: ['openai', 'anthropic'],
    out: path.resolve('tmp/llm-token-benchmark'),
    maxOutput: 8000,
    temperature: 0,
    delayBetweenCallsMs: 0,
    thinkingBudgetTokens: 0,
    reasoningEffort: 'medium',
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
    else if (arg === '--token') args.tokenPath = path.resolve(next())
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
    } else if (arg === '--out') args.out = path.resolve(next())
    else if (arg === '--max-output') args.maxOutput = Number(next())
    else if (arg === '--temperature') args.temperature = Number(next())
    else if (arg === '--delay-between-calls') args.delayBetweenCallsMs = Number(next())
    else if (arg === '--thinking') args.thinkingBudgetTokens = Number(next())
    else if (arg === '--reasoning-effort') {
      const value = next()
      if (value !== 'minimal' && value !== 'low' && value !== 'medium' && value !== 'high') {
        throw new Error(`--reasoning-effort must be one of minimal|low|medium|high, got ${value}`)
      }
      args.reasoningEffort = value
    }
    else if (arg === '--decode-instructions') args.decodeInstructionsPath = path.resolve(next())
    else if (arg === '--dry-run') args.dryRun = true
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
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required for provider openai')
    const modelId = defaultModelId('openai')
    return { provider: name, modelId, model: openai(modelId) }
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required for provider anthropic')
  }
  const modelId = defaultModelId('anthropic')
  return { provider: name, modelId, model: anthropic(modelId) }
}

function rawJsonPrompt(jsonText: string, question: string): string {
  return `You are analyzing the JSON document below.

Question:
${question}

${RESPONSE_CONTRACT}

JSON document:
${jsonText}`
}

function tokenPrompt(decodeInstructions: string, question: string): string {
  return `${decodeInstructions}

Question:
${question}

${RESPONSE_CONTRACT}`
}

interface RunCallArgs {
  providerConfig: ProviderConfig
  mode: CallMode
  messages: ModelMessage[]
  maxOutput: number
  temperature: number
  promptText: string
  imageBytes: number
  thinkingBudgetTokens: number
  reasoningEffort: Args['reasoningEffort']
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
      const path = prefix ? `${prefix}.${key}` : key
      if (typeof v === 'number') flat[path] = v
      else if (v && typeof v === 'object' && !Array.isArray(v)) {
        stack.push({ value: v as Record<string, unknown>, prefix: path })
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

async function runCall({
  providerConfig,
  mode,
  messages,
  maxOutput,
  temperature,
  promptText,
  imageBytes,
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
    // Anthropic requires temperature=1 when extended thinking is enabled.
    effectiveTemperature = 1
  }
  if (providerConfig.provider === 'openai') {
    providerOptions.openai = { reasoningEffort }
    // OpenAI reasoning models do not accept a custom temperature.
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
      response?: { id?: string; modelId?: string }
      steps?: unknown[]
      warnings?: unknown[]
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
      responseModelId: result.response?.modelId,
      stepsCount: Array.isArray(result.steps) ? result.steps.length : undefined,
      promptChars,
      promptBytes,
      imageBytes,
      text: result.text,
      warnings: result.warnings ?? [],
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

function extractJson(text: string | undefined): ParsedJson {
  if (!text) return { ok: false, reason: 'empty response' }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1]!.trim() : text.trim()

  try {
    return { ok: true, value: JSON.parse(candidate) }
  } catch {
    const first = candidate.indexOf('{')
    const last = candidate.lastIndexOf('}')
    if (first >= 0 && last > first) {
      try {
        return { ok: true, value: JSON.parse(candidate.slice(first, last + 1)) }
      } catch {
        // Fall through to text comparison.
      }
    }
  }

  return { ok: false, reason: 'response was not parseable JSON' }
}

function normalizeForCompare(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForCompare)
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [key, normalizeForCompare((value as Record<string, unknown>)[key])] as const)
    return Object.fromEntries(entries)
  }
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ')
  return value
}

function compareOutputs(raw: CallResult | undefined, token: CallResult | undefined): ValidationResult {
  if (!raw?.ok || !token?.ok) return { ok: false, reason: 'one or both calls failed' }

  const rawJson = extractJson(raw.text)
  const tokenJson = extractJson(token.text)

  if (rawJson.ok && tokenJson.ok) {
    const rawValue = (rawJson.value as { extractedValues?: unknown; answer?: unknown }) ?? {}
    const tokenValue = (tokenJson.value as { extractedValues?: unknown; answer?: unknown }) ?? {}
    const rawComparable = normalizeForCompare(rawValue.extractedValues ?? rawValue.answer ?? rawJson.value)
    const tokenComparable = normalizeForCompare(
      tokenValue.extractedValues ?? tokenValue.answer ?? tokenJson.value,
    )
    return {
      ok: JSON.stringify(rawComparable) === JSON.stringify(tokenComparable),
      kind: 'json',
      rawParseable: true,
      tokenParseable: true,
      rawComparable,
      tokenComparable,
    }
  }

  const rawText = normalizeForCompare(raw.text ?? '')
  const tokenText = normalizeForCompare(token.text ?? '')
  return {
    ok: rawText === tokenText,
    kind: 'text',
    rawParseable: rawJson.ok,
    tokenParseable: tokenJson.ok,
    rawParseReason: rawJson.ok ? undefined : rawJson.reason,
    tokenParseReason: tokenJson.ok ? undefined : tokenJson.reason,
  }
}

function flattenForTotals(result: CallResult): UsageTotals {
  const totals: UsageTotals = {}
  for (const [key, value] of Object.entries(result.totalUsage ?? result.usage ?? {})) {
    if (typeof value === 'number') totals[key] = value
  }
  for (const [providerKey, payload] of Object.entries(result.providerMetadata ?? {})) {
    for (const [field, value] of Object.entries(payload)) {
      if (typeof value === 'number') totals[`${providerKey}.${field}`] = value
    }
  }
  totals.calls = 1
  totals.elapsedMs = result.elapsedMs
  totals.promptBytes = result.promptBytes
  totals.imageBytes = result.imageBytes
  return totals
}

function addInto(target: UsageTotals, source: UsageTotals): void {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + value
  }
}

function aggregateUsage(results: CallResult[]): AggregatedUsage {
  const perCall: AggregatedUsage['perCall'] = []
  const perProvider: Record<string, UsageTotals> = {}
  const perMode: Record<string, UsageTotals> = {}
  const perProviderMode: Record<string, UsageTotals> = {}
  const grandTotal: UsageTotals = {}
  const inputBytesPerCall: AggregatedUsage['inputBytes']['perCall'] = []
  const efficiency: AggregatedUsage['efficiency'] = []
  let grandTotalPromptBytes = 0
  let grandTotalImageBytes = 0

  for (const result of results) {
    const usage = flattenForTotals(result)
    perCall.push({ provider: result.provider, mode: result.mode, usage })
    perProvider[result.provider] ??= {}
    perMode[result.mode] ??= {}
    const pmKey = `${result.provider}/${result.mode}`
    perProviderMode[pmKey] ??= {}
    addInto(perProvider[result.provider]!, usage)
    addInto(perMode[result.mode]!, usage)
    addInto(perProviderMode[pmKey]!, usage)
    addInto(grandTotal, usage)
    inputBytesPerCall.push({
      provider: result.provider,
      mode: result.mode,
      promptBytes: result.promptBytes,
      imageBytes: result.imageBytes,
    })
    grandTotalPromptBytes += result.promptBytes
    grandTotalImageBytes += result.imageBytes
    const inputTokens = (result.totalUsage ?? result.usage)?.inputTokens
    efficiency.push({
      provider: result.provider,
      mode: result.mode,
      promptBytes: result.promptBytes,
      imageBytes: result.imageBytes,
      inputTokens,
      bytesPerInputToken:
        inputTokens && inputTokens > 0
          ? Number(((result.promptBytes + result.imageBytes) / inputTokens).toFixed(2))
          : undefined,
    })
  }

  return {
    perCall,
    perProvider,
    perMode,
    perProviderMode,
    grandTotal,
    inputBytes: {
      perCall: inputBytesPerCall,
      grandTotalPromptBytes,
      grandTotalImageBytes,
    },
    efficiency,
  }
}

function summarizeUsage(result: CallResult | undefined): string {
  const source = result?.totalUsage ?? result?.usage
  if (!source) return 'usage=n/a'
  const parts: string[] = []
  for (const key of ['inputTokens', 'outputTokens', 'reasoningTokens', 'cachedInputTokens', 'totalTokens']) {
    const value = source[key]
    if (typeof value === 'number') parts.push(`${shortKey(key)}=${value}`)
  }
  for (const [providerKey, payload] of Object.entries(result?.providerMetadata ?? {})) {
    for (const [field, value] of Object.entries(payload)) {
      if (typeof value === 'number') parts.push(`${providerKey}.${field}=${value}`)
    }
  }
  return parts.length ? parts.join(' ') : 'usage=n/a'
}

function shortKey(key: string): string {
  return key
    .replace(/Tokens$/, '')
    .replace('cachedInput', 'cached')
    .replace('reasoning', 'reason')
    .replace('input', 'in')
    .replace('output', 'out')
    .replace('total', 'total')
}

type TableCell = string | number | undefined | null

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function fmtNum(value: number | undefined): string {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString('en-US')
}

function renderTextTable(headers: string[], rows: TableCell[][]): string {
  const allRows = [headers, ...rows.map((row) => row.map((cell) => (cell == null ? '—' : String(cell))))]
  const widths = headers.map((_, columnIndex) =>
    allRows.reduce((max, row) => Math.max(max, (row[columnIndex] ?? '').length), 0),
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

interface UsageRow {
  provider: string
  mode: string
  status: string
  inputTokens?: number
  outputTokens?: number
  reasoningTokens?: number
  cachedInputTokens?: number
  totalTokens?: number
  paidTokens?: number
  promptBytes: number
  imageBytes: number
  bytesPerInputToken?: number
  elapsedMs: number
  match?: string
}

function buildUsageRows(results: CallResult[]): UsageRow[] {
  return results.map((result) => {
    const u = result.totalUsage ?? result.usage
    const inputTokens = u?.inputTokens
    const paid = paidTokens(result)
    return {
      provider: result.provider,
      mode: result.mode,
      status: result.ok ? 'ok' : 'fail',
      inputTokens,
      outputTokens: u?.outputTokens,
      reasoningTokens: u?.reasoningTokens,
      cachedInputTokens: u?.cachedInputTokens,
      totalTokens: u?.totalTokens,
      paidTokens: paid,
      promptBytes: result.promptBytes,
      imageBytes: result.imageBytes,
      bytesPerInputToken:
        inputTokens && inputTokens > 0
          ? Number(((result.promptBytes + result.imageBytes) / inputTokens).toFixed(2))
          : undefined,
      elapsedMs: result.elapsedMs,
      match: result.expectedScore
        ? `${result.expectedScore.matches}/${result.expectedScore.total}`
        : undefined,
    }
  })
}

const USAGE_HEADERS = [
  'provider',
  'mode',
  'status',
  'paid tok',
  'in tok',
  'out tok',
  'prompt',
  'image',
  'B/tok',
  'elapsed',
  'match',
] as const

function rowToCells(row: UsageRow): TableCell[] {
  return [
    row.provider,
    row.mode,
    row.status,
    fmtNum(row.paidTokens),
    fmtNum(row.inputTokens),
    fmtNum(row.outputTokens),
    formatBytes(row.promptBytes),
    formatBytes(row.imageBytes),
    row.bytesPerInputToken === undefined ? '—' : row.bytesPerInputToken.toFixed(2),
    `${row.elapsedMs} ms`,
    row.match ?? '—',
  ]
}

function totalsRow(rows: UsageRow[]): UsageRow {
  const sum = (key: keyof UsageRow): number | undefined => {
    let total = 0
    let any = false
    for (const row of rows) {
      const value = row[key]
      if (typeof value === 'number') {
        total += value
        any = true
      }
    }
    return any ? total : undefined
  }
  const promptBytes = sum('promptBytes') ?? 0
  const imageBytes = sum('imageBytes') ?? 0
  const inputTokens = sum('inputTokens')
  const matchTotals = rows.reduce(
    (acc, row) => {
      if (!row.match) return acc
      const [matched, total] = row.match.split('/').map(Number)
      if (Number.isFinite(matched) && Number.isFinite(total)) {
        acc.matched += matched!
        acc.total += total!
        acc.any = true
      }
      return acc
    },
    { matched: 0, total: 0, any: false },
  )
  return {
    provider: 'TOTAL',
    mode: '',
    status: '',
    inputTokens,
    outputTokens: sum('outputTokens'),
    reasoningTokens: sum('reasoningTokens'),
    cachedInputTokens: sum('cachedInputTokens'),
    totalTokens: sum('totalTokens'),
    paidTokens: sum('paidTokens'),
    promptBytes,
    imageBytes,
    bytesPerInputToken:
      inputTokens && inputTokens > 0
        ? Number(((promptBytes + imageBytes) / inputTokens).toFixed(2))
        : undefined,
    elapsedMs: sum('elapsedMs') ?? 0,
    match: matchTotals.any ? `${matchTotals.matched}/${matchTotals.total}` : undefined,
  }
}

interface ExpectedFieldResult {
  expected: number | string | boolean | null
  /** Whatever the LLM actually returned — may be an object/array when it hallucinates. */
  found?: unknown
  ok: boolean
}

interface ExpectedScore {
  fields: Record<string, ExpectedFieldResult>
  matches: number
  total: number
  ok: boolean
}

function collectScoredLeaves(value: unknown, into: Record<string, ExpectedFieldResult['expected']>, prefix = ''): void {
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
  for (const [path, expectedValue] of Object.entries(flat)) {
    const lastKey = path.split('.').pop()!
    const foundDeep = findValueByKey(llmJson, lastKey)
    const ok = valuesEqual(expectedValue, foundDeep ?? null)
    fields[path] = {
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
  if (!parsed.ok) return
  result.expectedScore = scoreAnswer(parsed.value, expected)
}

function formatMatchSuffix(result: CallResult): string {
  if (!result.expectedScore) return ''
  const { matches, total } = result.expectedScore
  return ` match=${matches}/${total}`
}

interface ProviderVerdict {
  provider: ProviderName
  baselineScore?: string
  tokenScore?: string
  tokenAnswerOk: boolean
  reason: string
}

function buildVerdicts(results: CallResult[]): ProviderVerdict[] {
  const providers = Array.from(new Set(results.map((r) => r.provider))) as ProviderName[]
  return providers.map((provider) => {
    const raw = results.find((r) => r.provider === provider && r.mode === 'raw-json')
    const token = results.find((r) => r.provider === provider && r.mode === 'token-image')
    const baselineScore = raw?.expectedScore
      ? `${raw.expectedScore.matches}/${raw.expectedScore.total}`
      : raw?.ok === false
        ? 'baseline call failed'
        : undefined
    const tokenScore = token?.expectedScore
      ? `${token.expectedScore.matches}/${token.expectedScore.total}`
      : undefined

    if (!token) return { provider, baselineScore, tokenScore, tokenAnswerOk: false, reason: 'no token-image call' }
    if (!token.ok) return { provider, baselineScore, tokenScore, tokenAnswerOk: false, reason: `token call failed: ${token.error ?? 'unknown'}` }
    if (!token.expectedScore) return { provider, baselineScore, tokenScore, tokenAnswerOk: false, reason: 'token response was not parseable JSON' }

    if (token.expectedScore.ok) {
      return { provider, baselineScore, tokenScore, tokenAnswerOk: true, reason: 'token answer matched expected' }
    }
    const missed = Object.entries(token.expectedScore.fields)
      .filter(([, f]) => !f.ok)
      .map(([k]) => k)
    return {
      provider,
      baselineScore,
      tokenScore,
      tokenAnswerOk: false,
      reason: `token answer wrong: missed ${missed.join(', ')}`,
    }
  })
}

function renderVerdictTable(verdicts: ProviderVerdict[]): { text: string; markdown: string } {
  const headers = ['provider', 'baseline (raw)', 'token-image', 'verdict']
  const rows: TableCell[][] = verdicts.map((v) => [
    v.provider,
    v.baselineScore ?? '—',
    v.tokenScore ?? '—',
    v.tokenAnswerOk ? '✓ PASS' : '✗ FAIL',
  ])
  return {
    text: renderTextTable(headers, rows),
    markdown: renderMarkdownTable(headers, rows),
  }
}

function indent(text: string, prefix = '    '): string {
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n')
}

function renderTokenAnswerSection(results: CallResult[], expected: unknown): string {
  const lines: string[] = []
  lines.push('Expected:')
  const flatExpected: Record<string, ExpectedFieldResult['expected']> = {}
  collectScoredLeaves(expected, flatExpected)
  for (const [key, value] of Object.entries(flatExpected)) {
    lines.push(`  ${key}: ${formatScalar(value)}`)
  }
  lines.push('')

  const tokenCalls = results.filter((r) => r.mode === 'token-image')
  for (const result of tokenCalls) {
    lines.push(`${result.provider} / token-image:`)
    if (!result.ok) {
      lines.push(`  ✗ call failed: ${result.error ?? 'unknown error'}`)
      lines.push('')
      continue
    }

    if (result.expectedScore) {
      for (const [path, field] of Object.entries(result.expectedScore.fields)) {
        const marker = field.ok ? '✓' : '✗'
        const found = field.found === undefined ? 'missing' : formatScalar(field.found)
        const exp = formatScalar(field.expected)
        lines.push(`  ${marker} ${path}: got ${found}` + (field.ok ? '' : ` (expected ${exp})`))
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

interface CostComparison {
  provider: string
  rawPaid?: number
  tokenPaid?: number
  savedTokens?: number
  ratio?: number
}

function buildCostComparison(results: CallResult[]): {
  rows: CostComparison[]
  total: CostComparison
} {
  const providers = Array.from(new Set(results.map((r) => r.provider))) as ProviderName[]
  const rows: CostComparison[] = providers.map((provider) => {
    const raw = results.find((r) => r.provider === provider && r.mode === 'raw-json')
    const token = results.find((r) => r.provider === provider && r.mode === 'token-image')
    const rawPaid = raw ? paidTokens(raw) : undefined
    const tokenPaid = token ? paidTokens(token) : undefined
    return {
      provider,
      rawPaid,
      tokenPaid,
      savedTokens:
        rawPaid !== undefined && tokenPaid !== undefined ? rawPaid - tokenPaid : undefined,
      ratio:
        rawPaid !== undefined && tokenPaid !== undefined && tokenPaid > 0
          ? Number((rawPaid / tokenPaid).toFixed(2))
          : undefined,
    }
  })
  const totalRaw = rows.reduce((s, r) => s + (r.rawPaid ?? 0), 0)
  const totalToken = rows.reduce((s, r) => s + (r.tokenPaid ?? 0), 0)
  return {
    rows,
    total: {
      provider: 'TOTAL',
      rawPaid: totalRaw,
      tokenPaid: totalToken,
      savedTokens: totalRaw - totalToken,
      ratio: totalToken > 0 ? Number((totalRaw / totalToken).toFixed(2)) : undefined,
    },
  }
}

function renderCostTable(comparison: ReturnType<typeof buildCostComparison>): {
  text: string
  markdown: string
} {
  const headers = ['provider', 'raw paid', 'token paid', 'saved', 'ratio (raw / token)']
  const renderRow = (row: CostComparison): TableCell[] => [
    row.provider,
    fmtNum(row.rawPaid),
    fmtNum(row.tokenPaid),
    fmtNum(row.savedTokens),
    row.ratio === undefined ? '—' : `${row.ratio.toFixed(2)}×`,
  ]
  const rows: TableCell[][] = [...comparison.rows.map(renderRow), renderRow(comparison.total)]
  return {
    text: renderTextTable(headers, rows),
    markdown: renderMarkdownTable(headers, rows),
  }
}

function renderBaselineSummary(results: CallResult[]): string {
  const lines: string[] = []
  const rawCalls = results.filter((r) => r.mode === 'raw-json')
  for (const result of rawCalls) {
    if (!result.ok) {
      lines.push(`  ${result.provider}: baseline FAILED (${result.error ?? 'unknown'})`)
    } else if (result.expectedScore) {
      const { matches, total, ok } = result.expectedScore
      lines.push(
        `  ${result.provider}: ${matches}/${total} ${ok ? '✓' : '✗'}` +
          (ok ? '' : ' — baseline didn\'t reproduce expected, the question may be ambiguous'),
      )
    } else {
      lines.push(`  ${result.provider}: response not parseable`)
    }
  }
  return lines.join('\n')
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

function paidTokens(result: CallResult): number | undefined {
  const usage = result.totalUsage ?? result.usage
  if (!usage) return undefined
  if (typeof usage.totalTokens === 'number') return usage.totalTokens
  const input = usage.inputTokens ?? 0
  const output = usage.outputTokens ?? 0
  const reasoning = usage.reasoningTokens ?? 0
  return input + output + reasoning
}

function buildSavingsRows(rows: UsageRow[]): UsageRow[] {
  const providers = Array.from(new Set(rows.map((row) => row.provider)))
  const savings: UsageRow[] = []
  for (const provider of providers) {
    const raw = rows.find((row) => row.provider === provider && row.mode === 'raw-json')
    const token = rows.find((row) => row.provider === provider && row.mode === 'token-image')
    if (!raw || !token) continue
    const diff = (key: 'inputTokens' | 'outputTokens' | 'totalTokens' | 'paidTokens'): number | undefined => {
      if (typeof raw[key] !== 'number' || typeof token[key] !== 'number') return undefined
      return (raw[key] as number) - (token[key] as number)
    }
    savings.push({
      provider,
      mode: 'raw − token',
      status: '',
      inputTokens: diff('inputTokens'),
      outputTokens: diff('outputTokens'),
      reasoningTokens: undefined,
      cachedInputTokens: undefined,
      totalTokens: diff('totalTokens'),
      paidTokens: diff('paidTokens'),
      promptBytes: raw.promptBytes - token.promptBytes,
      imageBytes: raw.imageBytes - token.imageBytes,
      bytesPerInputToken: undefined,
      elapsedMs: raw.elapsedMs - token.elapsedMs,
      match: undefined,
    })
  }
  return savings
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function resolveExpectedPath(
  explicit: string | undefined,
  jsonPath: string,
): Promise<string | undefined> {
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`--expected file does not exist: ${explicit}`)
    return explicit
  }
  const candidate = path.join(path.dirname(jsonPath), 'expected-answer.json')
  return existsSync(candidate) ? candidate : undefined
}

async function decodeTokenToText(tokenBytes: Uint8Array): Promise<string | null> {
  try {
    const pack = await decode(tokenBytes)
    if (pack.isPack() || pack.isDiff()) return null
    return await pack.text()
  } catch {
    return null
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(usage())
    return
  }

  if (args.thinkingBudgetTokens > 0 && args.maxOutput <= args.thinkingBudgetTokens) {
    const bumped = args.thinkingBudgetTokens + 2000
    console.log(
      `[info] --max-output ${args.maxOutput} ≤ --thinking ${args.thinkingBudgetTokens}; bumping to ${bumped} (thinking budget must fit inside max_tokens).`,
    )
    args.maxOutput = bumped
  }

  requireFile(args.jsonPath, '--json file')
  requireFile(args.tokenPath, '--token file')
  if (!args.question && !args.questionFile) {
    throw new Error('Missing --question or --question-file')
  }

  const question = args.question ?? (await readFile(args.questionFile!, 'utf8')).trim()
  const decodeInstructions = args.decodeInstructionsPath
    ? await readFile(args.decodeInstructionsPath, 'utf8')
    : DEFAULT_DECODE_INSTRUCTIONS
  const jsonText = await readFile(args.jsonPath, 'utf8')
  const tokenImage = await readFile(args.tokenPath)

  try {
    JSON.parse(jsonText)
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`--json file is not valid JSON (${reason}): ${args.jsonPath}`)
  }

  const resolvedExpectedPath = await resolveExpectedPath(args.expectedPath, args.jsonPath)
  const expectedAnswer = resolvedExpectedPath
    ? (JSON.parse(await readFile(resolvedExpectedPath, 'utf8')) as unknown)
    : undefined

  const decodedTokenText = await decodeTokenToText(tokenImage)
  const tokenDecodeMatchedJson = decodedTokenText !== null && decodedTokenText === jsonText

  await mkdir(args.out, { recursive: true })

  const providers: ResolvedProvider[] = args.dryRun
    ? args.providers.map((provider) => ({ provider, modelId: defaultModelId(provider) }))
    : args.providers.map(makeProvider)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const runDir = path.join(args.out, timestamp)
  await mkdir(runDir, { recursive: true })

  const metadata = {
    startedAt: new Date().toISOString(),
    jsonPath: args.jsonPath,
    tokenPath: args.tokenPath,
    expectedPath: resolvedExpectedPath,
    jsonBytes: Buffer.byteLength(jsonText),
    tokenBytes: tokenImage.byteLength,
    question,
    providers: providers.map(({ provider, modelId }) => ({ provider, model: modelId })),
    maxOutput: args.maxOutput,
    temperature: args.temperature,
    tokenDecodeMatchedJson,
  }

  await writeFile(path.join(runDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

  if (args.dryRun) {
    console.log('Dry run: no API requests were sent.')
    console.log(`JSON bytes: ${metadata.jsonBytes}`)
    console.log(`Token image bytes: ${metadata.tokenBytes}`)
    console.log(`Question chars: ${question.length}`)
    console.log(`Decode instruction chars: ${decodeInstructions.length}`)
    console.log(`Token round-trips via @tokenpack/node decode: ${tokenDecodeMatchedJson}`)
    console.log(`Planned calls: ${providers.length * 2}`)
    console.log(`Wrote ${path.join(runDir, 'metadata.json')}`)
    return
  }

  const results: CallResult[] = []
  for (const providerConfig of providers as ProviderConfig[]) {
    const rawPromptText = rawJsonPrompt(jsonText, question)
    const tokenPromptText = tokenPrompt(decodeInstructions, question)
    const rawMessages: ModelMessage[] = [{ role: 'user', content: rawPromptText }]
    const tokenMessages: ModelMessage[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: tokenPromptText },
          { type: 'image', image: tokenImage, mediaType: 'image/png' },
        ],
      },
    ]

    if (results.length > 0 && args.delayBetweenCallsMs > 0) {
      await sleep(args.delayBetweenCallsMs)
    }
    console.log(`Running ${providerConfig.provider}/${providerConfig.modelId} raw-json...`)
    const raw = await runCall({
      providerConfig,
      mode: 'raw-json',
      messages: rawMessages,
      maxOutput: args.maxOutput,
      temperature: args.temperature,
      promptText: rawPromptText,
      imageBytes: 0,
      thinkingBudgetTokens: args.thinkingBudgetTokens,
      reasoningEffort: args.reasoningEffort,
    })
    if (expectedAnswer !== undefined) scoreCallAnswer(raw, expectedAnswer)
    results.push(raw)
    console.log(
      `  ${raw.ok ? 'ok' : 'failed'} ${raw.elapsedMs}ms ${summarizeUsage(raw)}` +
        formatMatchSuffix(raw),
    )

    if (args.delayBetweenCallsMs > 0) {
      await sleep(args.delayBetweenCallsMs)
    }
    console.log(`Running ${providerConfig.provider}/${providerConfig.modelId} token-image...`)
    const token = await runCall({
      providerConfig,
      mode: 'token-image',
      messages: tokenMessages,
      maxOutput: args.maxOutput,
      temperature: args.temperature,
      promptText: tokenPromptText,
      imageBytes: tokenImage.byteLength,
      thinkingBudgetTokens: args.thinkingBudgetTokens,
      reasoningEffort: args.reasoningEffort,
    })
    if (expectedAnswer !== undefined) scoreCallAnswer(token, expectedAnswer)
    results.push(token)
    console.log(
      `  ${token.ok ? 'ok' : 'failed'} ${token.elapsedMs}ms ${summarizeUsage(token)}` +
        formatMatchSuffix(token),
    )
  }

  const validations: Record<string, ValidationResult> = {}
  for (const { provider } of providers) {
    const raw = results.find((result) => result.provider === provider && result.mode === 'raw-json')
    const token = results.find((result) => result.provider === provider && result.mode === 'token-image')
    validations[provider] = { ...compareOutputs(raw, token), tokenDecodeMatchedJson }
  }

  const aggregated = aggregateUsage(results)
  const usageRows = buildUsageRows(results)
  const tableRows: TableCell[][] = usageRows.map(rowToCells)
  const headersMutable = [...USAGE_HEADERS]
  const textTable = renderTextTable(headersMutable, tableRows)
  const markdownTable = renderMarkdownTable(headersMutable, tableRows)
  const verdicts = expectedAnswer !== undefined ? buildVerdicts(results) : []
  const verdictTable = verdicts.length ? renderVerdictTable(verdicts) : undefined
  const tokenAnswerSection =
    expectedAnswer !== undefined ? renderTokenAnswerSection(results, expectedAnswer) : ''
  const baselineSummary = expectedAnswer !== undefined ? renderBaselineSummary(results) : ''
  const overallPass = verdicts.length > 0 && verdicts.every((v) => v.tokenAnswerOk)
  const costComparison = buildCostComparison(results)
  const costTable = renderCostTable(costComparison)

  const report = {
    metadata,
    results,
    validations,
    usage: aggregated,
    costComparison,
    expectedAnswer,
    verdicts,
    overallPass,
    completedAt: new Date().toISOString(),
  }

  await writeFile(path.join(runDir, 'report.json'), JSON.stringify(report, null, 2))
  await writeFile(
    path.join(runDir, 'summary.md'),
    [
      '# LLM Token Benchmark',
      '',
      `**Test goal:** does the LLM, given the token-image PNG, produce an answer that matches the expected fixture?`,
      '',
      `**Overall result:** ${overallPass ? '✓ PASS' : '✗ FAIL'} on token-image vs expected.`,
      '',
      ...(verdictTable
        ? ['## Verdict (per provider)', '', verdictTable.markdown, '']
        : []),
      '## Cost — token-image vs raw-json (paid tokens)',
      '',
      costTable.markdown,
      '',
      ...(tokenAnswerSection
        ? ['## Token-image answers (the test)', '', '```', tokenAnswerSection, '```', '']
        : []),
      ...(baselineSummary
        ? ['## Baseline (raw-json) — sanity check only', '', '```', baselineSummary, '```', '']
        : []),
      `JSON bytes: ${metadata.jsonBytes}`,
      `Token PNG bytes: ${metadata.tokenBytes}`,
      `Token round-trips via @tokenpack/node decode: ${tokenDecodeMatchedJson}`,
      '',
      '## Usage comparison',
      '',
      markdownTable,
      '',
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
          result.responseId ? `Response id: ${result.responseId}` : '',
          result.stepsCount !== undefined ? `Steps: ${result.stepsCount}` : '',
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
      '## Raw vs token cross-check',
      '',
      '_Not the headline; the headline is the verdict above. This block compares the raw-json and token-image answers to each other (consistency check)._',
      '',
      '```json',
      JSON.stringify(validations, null, 2),
      '```',
      '',
      '## Raw usage aggregate',
      '',
      '```json',
      JSON.stringify(aggregated, null, 2),
      '```',
      '',
    ].join('\n'),
  )

  console.log('')
  console.log(`Wrote ${path.join(runDir, 'report.json')}`)
  console.log(`Wrote ${path.join(runDir, 'summary.md')}`)
  console.log('')
  if (verdictTable) {
    console.log('=== VERDICT — token-image vs expected ===')
    console.log(verdictTable.text)
    console.log('')
    console.log(`Overall: ${overallPass ? '✓ PASS' : '✗ FAIL'}`)
    console.log('')
  } else {
    console.log('No expected-answer.json found — pass --expected to enable answer validation.')
    console.log('')
  }
  console.log('=== COST — token-image vs raw-json (paid tokens) ===')
  console.log(costTable.text)
  console.log('')
  if (tokenAnswerSection) {
    console.log('Token-image answers (the test):')
    console.log(tokenAnswerSection)
    console.log('')
  }
  if (baselineSummary) {
    console.log('Baseline (raw-json) — sanity check only:')
    console.log(baselineSummary)
    console.log('')
  }
  console.log('Usage comparison:')
  console.log(textTable)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  console.error('')
  console.error(usage())
  process.exitCode = 1
})
