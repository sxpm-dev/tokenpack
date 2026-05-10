import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { brotliCompressSync, deflateSync } from 'node:zlib'

import { encode, PackBuilder } from '@tokenpack/node'

import {
  contentEncodingHeader,
  networkConditionFor,
  NO_CACHE_HEADERS,
  param,
  throttledBody,
} from '../runtime-benchmark/_shared'

export { networkConditionFor, NO_CACHE_HEADERS, param, throttledBody }

const REPO_ROOT = path.resolve(process.cwd(), '..', '..')
const SOURCE_PATH = path.join(REPO_ROOT, 'benchmark', 'sources', 'client-spec-map.json')
const CACHE_DIR = path.join(process.cwd(), 'benchmark-fixtures', 'json-playground')
const ROOT_PACK_PATH = path.join(CACHE_DIR, 'client-spec-map-root-records.pixel-range-none.png')
const ROOT_PACK_META_PATH = path.join(CACHE_DIR, 'client-spec-map-root-records.meta.json')

export type JsonEncoding = 'raw' | 'deflate' | 'brotli'
export type JsonPackMode = 'fixture' | 'lazy'
export type JsonRecordKind = 'collection' | 'component'

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
  if (encoding === 'deflate') return { body: deflateSync(body), contentEncoding: 'deflate' }
  if (encoding === 'brotli') return { body: brotliCompressSync(body), contentEncoding: 'br' }

  return { body, contentEncoding: null }
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

export async function ensureRootPack(mode: JsonPackMode = 'fixture'): Promise<RootPackMeta> {
  const data = loadJsonPlaygroundData()
  const previous = readRootPackMeta()

  if (previous && previous.sourceSha256 === data.sourceSha256 && fs.existsSync(ROOT_PACK_PATH)) {
    return previous
  }
  if (mode === 'fixture') {
    throw new JsonPlaygroundFixtureError(
      'JSON playground root pack fixture is missing or stale. Run `yarn benchmark:json-playground`, or switch the playground pack mode to lazy.',
    )
  }

  return generateRootPack()
}

export async function generateRootPack(): Promise<RootPackMeta> {
  const data = loadJsonPlaygroundData()

  fs.mkdirSync(CACHE_DIR, { recursive: true })

  const builder = new PackBuilder()

  for (const record of data.records) {
    builder.withFile(record.path, JSON.stringify(toLineRecord(record)))
  }

  const token = await encode(builder, {
    algo: 'pixel-range-none',
    algoOptions: { surface: { channels: 3 } },
    compressor: 'deflate-9',
  })

  fs.writeFileSync(ROOT_PACK_PATH, token)

  const meta: RootPackMeta = {
    sourceSha256: data.sourceSha256,
    records: data.records.map(safeRecordSummary),
    tokenBytes: token.byteLength,
    createdAt: new Date().toISOString(),
  }

  fs.writeFileSync(ROOT_PACK_META_PATH, JSON.stringify(meta, null, 2))

  return meta
}

export function readRootPackStatus(): {
  available: boolean
  path: string
  meta: RootPackMeta | null
  stale: boolean
} {
  const data = loadJsonPlaygroundData()
  const meta = readRootPackMeta()
  const available = Boolean(meta && fs.existsSync(ROOT_PACK_PATH))

  return {
    available,
    path: ROOT_PACK_PATH,
    meta,
    stale: !available || meta?.sourceSha256 !== data.sourceSha256,
  }
}

export function rootPackPath(): string {
  return ROOT_PACK_PATH
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

function readRootPackMeta(): RootPackMeta | null {
  try {
    return JSON.parse(fs.readFileSync(ROOT_PACK_META_PATH, 'utf-8')) as RootPackMeta
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
