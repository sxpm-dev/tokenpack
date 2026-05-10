import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  ensureRootPack,
  JsonPlaygroundFixtureError,
  loadJsonPlaygroundData,
  param,
  parsePackMode,
  readRootPackStatus,
  safeRecordSummary,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const data = loadJsonPlaygroundData()
  const mode = parsePackMode(param(req, 'mode'))
  const status = readRootPackStatus()
  let rootPack = status.meta
  let rootPackError: string | null = null
  let rootPackAvailable = status.available && !status.stale

  if (mode === 'lazy' || (status.available && !status.stale)) {
    try {
      rootPack = await ensureRootPack(mode)
      rootPackAvailable = true
    } catch (error) {
      if (!(error instanceof JsonPlaygroundFixtureError)) throw error
      rootPackError = error.message
      rootPackAvailable = false
    }
  } else if (!status.available || status.stale) {
    rootPackError =
      'JSON playground root pack fixture is missing or stale. Run `yarn benchmark:json-playground`, or switch pack mode to lazy.'
    rootPackAvailable = false
  }

  const records = data.records.map(safeRecordSummary)

  return NextResponse.json({
    source: {
      id: 'client-spec-map',
      file: 'client-spec-map.json',
      bytes: data.sourceBytes.byteLength,
      sha256: data.sourceSha256,
      rootKeyCount: data.rootKeys.length,
      recordCount: data.records.length,
      ndjsonBytes: data.ndjsonBytes.byteLength,
    },
    rootKeys: data.rootKeys,
    records,
    rootPack: {
      available: Boolean(rootPack && rootPackAvailable),
      bytes: rootPack?.tokenBytes ?? 0,
      error: rootPackError,
      mode,
      path: status.path,
      records: rootPack?.records.length ?? records.length,
      url: '/api/json-playground/root-pack',
    },
    suggestedRecordId:
      records.find(record => record.kind === 'component')?.id ?? records[0]?.id ?? null,
  })
}
