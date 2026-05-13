import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import type { CapturedAsset, ThrottleConfig } from '../config/types.js'
import { stripWireHeaders } from '../replay/strip-encoding.js'

export const ASSET_STORE_DIR = 'assets'
export const ASSET_STORE_INDEX = `${ASSET_STORE_DIR}/index.json`
export const ENTRY_DOCUMENT_PATH = `${ASSET_STORE_DIR}/entry-document.html`

export interface StoredAssetEntry {
  url: string
  seq: number
  status: number
  headers: Readonly<Record<string, string>>
  bodyPath: string
  rawBytes: number
  wireBytes: number | null
  contentEncoding: string | null
}

export interface StoredAssetIndex {
  version: 1
  entryDocument?: {
    url: string
    status: number
    headers: Readonly<Record<string, string>>
    bodyPath: string
    rawBytes: number
  }
  assets: StoredAssetEntry[]
}

export interface RecordedAsset {
  url: string
  status: number
  headers: Readonly<Record<string, string>>
  body: Buffer
  rawBytes: number
  wireBytes: number | null
}

export interface RecordedAssetStore {
  byUrl: ReadonlyMap<string, RecordedAsset>
  entryDocument?: ReplayEntryDocument
}

export async function writeAssetStore(
  assets: ReadonlyArray<CapturedAsset>,
  fixtureDir: string,
  entryDocument?: {
    url: string
    status: number
    headers: Readonly<Record<string, string>>
    body: Uint8Array
  },
): Promise<string> {
  const bodiesDir = `${fixtureDir}/${ASSET_STORE_DIR}/bodies`

  await mkdir(bodiesDir, { recursive: true })

  const entries: StoredAssetEntry[] = []

  for (const asset of assets) {
    const hash = createHash('sha256').update(asset.url).digest('hex').slice(0, 16)
    const bodyPath = `${ASSET_STORE_DIR}/bodies/${asset.seq}-${hash}.bin`

    await writeFile(`${fixtureDir}/${bodyPath}`, asset.body)
    entries.push({
      url: asset.url,
      seq: asset.seq,
      status: asset.status,
      headers: stripWireHeaders(asset.headers),
      bodyPath,
      rawBytes: asset.rawBytes,
      wireBytes: asset.wireBytes,
      contentEncoding: asset.contentEncoding,
    })
  }

  if (entryDocument) {
    await writeFile(`${fixtureDir}/${ENTRY_DOCUMENT_PATH}`, entryDocument.body)
  }

  const index: StoredAssetIndex = {
    version: 1,
    entryDocument: entryDocument
      ? {
          url: entryDocument.url,
          status: entryDocument.status,
          headers: stripWireHeaders(entryDocument.headers),
          bodyPath: ENTRY_DOCUMENT_PATH,
          rawBytes: entryDocument.body.byteLength,
        }
      : undefined,
    assets: entries,
  }
  const indexPath = `${fixtureDir}/${ASSET_STORE_INDEX}`

  await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8')

  return indexPath
}

export interface ReplayEntryDocument {
  url: string
  status: number
  headers: Readonly<Record<string, string>>
  body: Buffer
}

export async function loadReplayEntryDocument(
  fixtureDir: string,
): Promise<ReplayEntryDocument | null> {
  const index = JSON.parse(
    await readFile(`${fixtureDir}/${ASSET_STORE_INDEX}`, 'utf8'),
  ) as StoredAssetIndex

  if (!index.entryDocument) return null

  return {
    url: index.entryDocument.url,
    status: index.entryDocument.status,
    headers: index.entryDocument.headers,
    body: await readFile(`${fixtureDir}/${index.entryDocument.bodyPath}`),
  }
}

export async function loadAssetStore(fixtureDir: string): Promise<RecordedAssetStore> {
  const index = JSON.parse(
    await readFile(`${fixtureDir}/${ASSET_STORE_INDEX}`, 'utf8'),
  ) as StoredAssetIndex
  const byUrl = new Map<string, RecordedAsset>()

  for (const entry of index.assets) {
    byUrl.set(entry.url, {
      url: entry.url,
      status: entry.status,
      headers: entry.headers,
      body: await readFile(`${fixtureDir}/${entry.bodyPath}`),
      rawBytes: entry.rawBytes,
      wireBytes: entry.wireBytes,
    })
  }

  const entryDocument = index.entryDocument
    ? {
        url: index.entryDocument.url,
        status: index.entryDocument.status,
        headers: index.entryDocument.headers,
        body: await readFile(`${fixtureDir}/${index.entryDocument.bodyPath}`),
      }
    : undefined

  return { byUrl, entryDocument }
}

export function simulatedNetworkDelayMs(bytes: number, throttle: ThrottleConfig): number {
  const downloadBps = (throttle.downloadKbps * 1024) / 8

  if (!Number.isFinite(downloadBps) || downloadBps <= 0) return throttle.rttMs

  return throttle.rttMs + (bytes / downloadBps) * 1000
}
