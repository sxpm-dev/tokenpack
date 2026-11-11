import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { brotliCompressSync, deflateSync } from 'node:zlib'

import { encode, PackBuilder } from '@tokenpack/node'

import {
  contentEncodingHeader,
  type NetworkCondition,
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
} from '../runtime-benchmark/_shared'

export { networkConditionFor, NO_CACHE_HEADERS, param }

const REPO_ROOT = path.resolve(process.cwd(), '..', '..')
const SOURCE_PATH = path.join(REPO_ROOT, 'benchmark', 'sources', 'client-spec-map.json')
const CACHE_DIR = path.join(process.cwd(), 'benchmark-fixtures', 'json-playground')

const sleep = (ms: number): Promise<void> =>
  ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve()

const FIRST_THROTTLE_CHUNK = 16 * 1024
const THROTTLE_CHUNK = 256 * 1024

export type JsonEncoding = 'raw' | 'deflate' | 'brotli'
export type JsonPackMode = 'fixture' | 'lazy'
export type JsonDocumentFixtureKind = 'source-json' | 'records-ndjson'
export type JsonRecordKind = 'collection' | 'component'
export type JsonTokenAlgo = 'pixel-range-none-c3' | 'linear-deflate-c3'

const JSON_TOKEN_ALGOS: Record<
  JsonTokenAlgo,
  { algo: string; channels: 3; compressor: string; file: string }
> = {
  'pixel-range-none-c3': {
    algo: 'pixel-range-none',
    channels: 3,
    compressor: 'deflate-9',
    file: 'client-spec-map-root-records.pixel-range-none-c3.png',
  },
  'linear-deflate-c3': {
    algo: 'linear-deflate',
    channels: 3,
    compressor: 'deflate-9',
    file: 'client-spec-map-root-records.linear-deflate-c3.png',
  },
}

export interface JsonRecord {
  id: string
  kind: JsonRecordKind
  parentKey: string | null
  path: string
  label: string
  byteLength: number
  value: unknown
}

export interface JsonPlaygroundData {
  sourceText: string
  sourceBytes: Buffer
  sourceSha256: string
  root: Record<string, unknown>
  rootKeys: string[]
  records: JsonRecord[]
  ndjsonText: string
  ndjsonBytes: Buffer
}

export interface RootPackMeta {
  algo: JsonTokenAlgo
  sourceSha256: string
  records: Array<Omit<JsonRecord, 'value'>>
  tokenBytes: number
  createdAt: string
}

export class JsonPlaygroundFixtureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JsonPlaygroundFixtureError'
  }
}

let cachedData: JsonPlaygroundData | null = null
const encodedBodyCache = new WeakMap<
  Buffer,
  Partial<Record<JsonEncoding, { body: Buffer; contentEncoding: string | null }>>
>()

export function loadJsonPlaygroundData(): JsonPlaygroundData {
  if (cachedData) return cachedData

  const sourceBytes = fs.readFileSync(SOURCE_PATH)
  const sourceText = sourceBytes.toString('utf-8')
  const root = JSON.parse(sourceText) as Record<string, unknown>
  const rootKeys = Object.keys(root)
  const records = buildRecords(root)
  const ndjsonText = records.map(record => JSON.stringify(toLineRecord(record))).join('\n') + '\n'

  cachedData = {
    sourceText,
    sourceBytes,
    sourceSha256: sha256(sourceBytes),
    root,
    rootKeys,
    records,
    ndjsonText,
    ndjsonBytes: Buffer.from(ndjsonText, 'utf-8'),
  }

  return cachedData
}

export function encodedBody(
  body: Buffer,
  encoding: JsonEncoding,
): { body: Buffer; contentEncoding: string | null } {
  if (encoding === 'raw') return { body, contentEncoding: null }

  const fixtureKind = documentFixtureKindForBody(body)

  if (fixtureKind) {
    const fixture = readEncodedDocumentFixture(fixtureKind, encoding)

    if (fixture) return fixture
  }

  let cached = encodedBodyCache.get(body)
  const hit = cached?.[encoding]

  if (hit) return hit

  const encoded =
    encoding === 'deflate'
      ? { body: deflateSync(body), contentEncoding: 'deflate' }
      : { body: brotliCompressSync(body), contentEncoding: 'br' }

  if (!cached) {
    cached = {}
    encodedBodyCache.set(body, cached)
  }
  cached[encoding] = encoded

  return encoded
}

export function generateEncodedDocumentFixtures(): void {
  const data = loadJsonPlaygroundData()

  writeEncodedDocumentFixture('source-json', 'deflate', deflateSync(data.sourceBytes))
  writeEncodedDocumentFixture('source-json', 'brotli', brotliCompressSync(data.sourceBytes))
  writeEncodedDocumentFixture('records-ndjson', 'deflate', deflateSync(data.ndjsonBytes))
  writeEncodedDocumentFixture('records-ndjson', 'brotli', brotliCompressSync(data.ndjsonBytes))
}

export function parseEncoding(value: string | null): JsonEncoding {
  const encoding = (value ?? 'raw').toLowerCase()

  if (encoding === 'raw' || encoding === 'deflate' || encoding === 'brotli') return encoding

  throw new Error(`unsupported encoding: ${encoding}`)
}

export function parsePackMode(value: string | null): JsonPackMode {
  const mode = (value ?? 'fixture').toLowerCase()

  if (mode === 'fixture' || mode === 'lazy') return mode

  throw new Error(`unsupported JSON playground pack mode: ${mode}`)
}

export function responseHeaders(
  body: Buffer,
  encoding: JsonEncoding,
  contentType: string,
  throttle: string | null,
): Record<string, string> {
  const contentEncoding = contentEncodingHeader(encoding)
  const condition = networkConditionFor(throttle)
  const headers: Record<string, string> = {
    ...NO_CACHE_HEADERS,
    'content-length': String(body.length),
    'content-type': contentType,
    'x-json-playground-throttle': condition.name,
  }

  if (contentEncoding) headers['content-encoding'] = contentEncoding

  return headers
}

export function throttledBody(body: Buffer, condition: NetworkCondition): any {
  const { latencyMs, bandwidthBps } = condition

  if (latencyMs === 0 && !Number.isFinite(bandwidthBps)) {
    return body
  }

  const view = new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
  let cancelled = false

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (latencyMs > 0) await sleep(latencyMs)

      let offset = 0

      while (!cancelled && offset < view.byteLength) {
        const size = offset === 0 ? FIRST_THROTTLE_CHUNK : THROTTLE_CHUNK
        const end = Math.min(offset + size, view.byteLength)
        const chunk = view.subarray(offset, end)
        const waitMs = Number.isFinite(bandwidthBps) ? (chunk.byteLength / bandwidthBps) * 1000 : 0

        if (waitMs > 0) await sleep(waitMs)
        if (cancelled) return

        controller.enqueue(chunk)
        offset = end
      }

      if (!cancelled) controller.close()
    },
    cancel() {
      cancelled = true
    },
  })
}

export function parseTokenAlgo(value: string | null): JsonTokenAlgo {
  const algo = (value ?? 'pixel-range-none-c3').toLowerCase()

  if (algo === 'pixel-range-none-c3' || algo === 'linear-deflate-c3') return algo

  throw new Error(`unsupported JSON playground token algo: ${algo}`)
}

export async function ensureRootPack(
  mode: JsonPackMode = 'fixture',
  algo: JsonTokenAlgo = 'pixel-range-none-c3',
): Promise<RootPackMeta> {
  const data = loadJsonPlaygroundData()
  const previous = readRootPackMeta(algo)

  if (
    previous &&
    previous.sourceSha256 === data.sourceSha256 &&
    fs.existsSync(rootPackPath(algo))
  ) {
    return previous
  }
  if (mode === 'fixture') {
    throw new JsonPlaygroundFixtureError(
      'JSON playground root pack fixture is missing or stale. Run `yarn benchmark:json-playground`, or switch the playground pack mode to lazy.',
    )
  }

  return generateRootPack(algo)
}

export async function generateRootPack(
  algo: JsonTokenAlgo = 'pixel-range-none-c3',
): Promise<RootPackMeta> {
  const data = loadJsonPlaygroundData()
  const config = JSON_TOKEN_ALGOS[algo]

  fs.mkdirSync(CACHE_DIR, { recursive: true })

  const builder = new PackBuilder()

  for (const record of data.records) {
    builder.withFile(record.path, JSON.stringify(toLineRecord(record)))
  }

  const token = await encode(builder, {
    algo: config.algo,
    algoOptions: { surface: { channels: config.channels } },
    compressor: config.compressor,
  })

  fs.writeFileSync(rootPackPath(algo), token)

  const meta: RootPackMeta = {
    algo,
    sourceSha256: data.sourceSha256,
    records: data.records.map(safeRecordSummary),
    tokenBytes: token.byteLength,
    createdAt: new Date().toISOString(),
  }

  fs.writeFileSync(rootPackMetaPath(algo), JSON.stringify(meta, null, 2))

  return meta
}

export function readRootPackStatus(algo: JsonTokenAlgo = 'pixel-range-none-c3'): {
  available: boolean
  path: string
  meta: RootPackMeta | null
  stale: boolean
} {
  const data = loadJsonPlaygroundData()
  const meta = readRootPackMeta(algo)
  const path = rootPackPath(algo)
  const available = Boolean(meta && fs.existsSync(path))

  return {
    available,
    path,
    meta,
    stale: !available || meta?.sourceSha256 !== data.sourceSha256,
  }
}

export function rootPackPath(algo: JsonTokenAlgo = 'pixel-range-none-c3'): string {
  return path.join(CACHE_DIR, JSON_TOKEN_ALGOS[algo].file)
}

function rootPackMetaPath(algo: JsonTokenAlgo): string {
  return path.join(CACHE_DIR, `${JSON_TOKEN_ALGOS[algo].file}.meta.json`)
}

export function encodedDocumentFixturePath(
  kind: JsonDocumentFixtureKind,
  encoding: Exclude<JsonEncoding, 'raw'>,
): string {
  const data = loadJsonPlaygroundData()
  const extension = encoding === 'brotli' ? 'br' : 'deflate'

  return path.join(CACHE_DIR, `${kind}.${data.sourceSha256}.${extension}`)
}

function documentFixtureKindForBody(body: Buffer): JsonDocumentFixtureKind | null {
  const data = cachedData

  if (!data) return null
  if (body === data.sourceBytes) return 'source-json'
  if (body === data.ndjsonBytes) return 'records-ndjson'

  return null
}

function readEncodedDocumentFixture(
  kind: JsonDocumentFixtureKind,
  encoding: Exclude<JsonEncoding, 'raw'>,
): { body: Buffer; contentEncoding: string | null } | null {
  const fixturePath = encodedDocumentFixturePath(kind, encoding)

  if (!fs.existsSync(fixturePath)) return null

  return {
    body: fs.readFileSync(fixturePath),
    contentEncoding: encoding === 'brotli' ? 'br' : 'deflate',
  }
}

function writeEncodedDocumentFixture(
  kind: JsonDocumentFixtureKind,
  encoding: Exclude<JsonEncoding, 'raw'>,
  body: Buffer,
): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(encodedDocumentFixturePath(kind, encoding), body)
}

export function safeRecordSummary(record: JsonRecord): Omit<JsonRecord, 'value'> {
  return {
    byteLength: record.byteLength,
    id: record.id,
    kind: record.kind,
    label: record.label,
    parentKey: record.parentKey,
    path: record.path,
  }
}

export function getRecordById(id: string): JsonRecord | null {
  const data = loadJsonPlaygroundData()

  return data.records.find(record => record.id === id) ?? null
}

function buildRecords(root: Record<string, unknown>): JsonRecord[] {
  const records: JsonRecord[] = []

  for (const [key, value] of Object.entries(root)) {
    records.push(
      makeRecord(`collection:${key}`, 'collection', null, `collections/${key}.json`, key, value),
    )

    if (!isObject(value)) continue
    const components = value.components

    if (!Array.isArray(components)) continue

    components.forEach((component, index) => {
      const componentId =
        isObject(component) && typeof component.componentId === 'string'
          ? component.componentId
          : `${key}-${index}`

      records.push(
        makeRecord(
          `component:${componentId}`,
          'component',
          key,
          `components/${key}/${String(index).padStart(4, '0')}-${componentId}.json`,
          componentId,
          component,
        ),
      )
    })
  }

  return records
}

function makeRecord(
  id: string,
  kind: JsonRecordKind,
  parentKey: string | null,
  recordPath: string,
  label: string,
  value: unknown,
): JsonRecord {
  return {
    id,
    kind,
    parentKey,
    path: recordPath,
    label,
    byteLength: Buffer.byteLength(JSON.stringify(value), 'utf-8'),
    value,
  }
}

function toLineRecord(record: JsonRecord): JsonRecord {
  return record
}

function readRootPackMeta(algo: JsonTokenAlgo): RootPackMeta | null {
  try {
    return JSON.parse(fs.readFileSync(rootPackMetaPath(algo), 'utf-8')) as RootPackMeta
  } catch {
    return null
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}
