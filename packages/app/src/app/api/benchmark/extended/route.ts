import '@tokenpack/node'

import { nodeAlgorithmCatalog as algorithmCatalog } from '@tokenpack/node/algorithms/catalog'
import { existsSync, readFileSync } from 'fs'
import { NextResponse } from 'next/server'
import { join } from 'path'

import type { ExtBenchRow } from '@/lib/bench-types'

export type { ExtBenchRow } from '@/lib/bench-types'

interface SpeedResultRow {
  scenario: string
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  condition: string
  fetchMs: number
  decodeMs: number
  totalMs: number
  transferBytes: number
  decodedBytes: number
  throughputMBps: number
  pathTaken?: 'stream' | 'batch'
  totalMsStddev?: number
}

interface EncodeTimeEntry {
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  algorithm: string
  surface: string
  compressor: string
  channels: number
  encodeMs: number
  tokenBytes: number
  originalBytes: number
}

interface ArchiveTimeEntry {
  source: string
  sourceId?: string
  chunkCount?: number
  chunkIndex?: number
  format: string
  encodeMs: number
  bytes: number
  originalBytes: number
}

const ARCHIVE_META: Record<
  string,
  { label: string; surfaceId: string; compressorId: string; codecId: number }
> = {
  zip: { label: 'zip', surfaceId: 'archive', compressorId: 'zip', codecId: -1 },
  'tar.gz': { label: 'gzip-6 / tar.gz', surfaceId: 'archive', compressorId: 'gzip-6', codecId: -2 },
  deflate: { label: 'deflate-6', surfaceId: 'raw', compressorId: 'deflate-6', codecId: -3 },
  'brotli-11': { label: 'brotli-11', surfaceId: 'raw', compressorId: 'brotli-11', codecId: -4 },
  'brotli-6': { label: 'brotli-6', surfaceId: 'raw', compressorId: 'brotli-6', codecId: -5 },
}

function supportsRow(row: ExtBenchRow): boolean {
  try {
    return algorithmCatalog
      .getByName(row.codecName)
      .capabilities.channels.includes(row.channels as 1 | 2 | 3 | 4)
  } catch {
    return row.kind === 'archive'
  }
}

export async function GET() {
  const resultsPath = join(process.cwd(), 'benchmark-results', 'results.json')
  const encodeTimesPath = join(process.cwd(), 'benchmark-results', 'encode-times.json')
  const archiveTimesPath = join(process.cwd(), 'benchmark-results', 'archive-times.json')

  if (!existsSync(resultsPath) || !existsSync(encodeTimesPath) || !existsSync(archiveTimesPath)) {
    return NextResponse.json(
      { error: 'No speed results found. Run: yarn benchmark' },
      { status: 404 },
    )
  }

  const speedRows = JSON.parse(readFileSync(resultsPath, 'utf-8')) as SpeedResultRow[]
  const encodeRows = JSON.parse(readFileSync(encodeTimesPath, 'utf-8')) as EncodeTimeEntry[]
  const archiveRows = JSON.parse(readFileSync(archiveTimesPath, 'utf-8')) as ArchiveTimeEntry[]
  const rows = speedRows.map(row => toExtendedRow(row, encodeRows, archiveRows)).filter(supportsRow)

  return NextResponse.json({
    rows,
    totalRows: rows.length,
    visibleRows: rows.length,
  })
}

function toExtendedRow(
  speed: SpeedResultRow,
  encodeRows: EncodeTimeEntry[],
  archiveRows: ArchiveTimeEntry[],
): ExtBenchRow {
  const token = /^(.*)-c([1-4])$/.exec(speed.scenario)

  return token
    ? tokenRow(speed, token[1], Number(token[2]) as 1 | 2 | 3 | 4, encodeRows)
    : archiveRow(speed, archiveRows)
}

function tokenRow(
  speed: SpeedResultRow,
  algorithm: string,
  channels: 1 | 2 | 3 | 4,
  encodeRows: EncodeTimeEntry[],
): ExtBenchRow {
  const entry = encodeRows.find(
    e => e.algorithm === algorithm && e.channels === channels && sameSourceCase(e, speed),
  )
  const Ctor = algorithmCatalog.getByName(algorithm)
  const instance = new Ctor({})
  const surfaceId =
    (instance as unknown as { surface?: { id?: string } }).surface?.id ?? entry?.surface
  const compressorId =
    (instance as unknown as { compressor?: { id?: string } }).compressor?.id ?? entry?.compressor
  const originalBytes = entry?.originalBytes ?? speed.decodedBytes
  const encodeMs = entry?.encodeMs ?? 0

  return {
    codecId: Ctor.id,
    kind: 'token',
    codecName: algorithm,
    outerCompression: compressorId ?? entry?.compressor ?? 'unknown',
    channels,
    source: speed.source,
    sourceId: speed.sourceId,
    chunkCount: speed.chunkCount,
    chunkIndex: speed.chunkIndex,
    condition: speed.condition,
    encodeMs: round1(encodeMs),
    speedMs: speed.totalMs,
    fetchMs: speed.fetchMs,
    decodeTailMs: speed.decodeMs,
    decodeMs: speed.decodeMs,
    roundTripMs: speed.totalMs,
    tokenBytes: speed.transferBytes,
    originalBytes,
    ratio: ratio(speed.transferBytes, originalBytes),
    throughputMBps: speed.throughputMBps,
    isStreaming: speed.pathTaken === 'stream',
    isBrowserSafe: Ctor.capabilities.environments.includes('browser'),
    surfaceId,
    compressorId,
    pathTaken: speed.pathTaken ?? 'batch',
  }
}

function archiveRow(speed: SpeedResultRow, archiveRows: ArchiveTimeEntry[]): ExtBenchRow {
  const meta = ARCHIVE_META[speed.scenario] ?? {
    label: speed.scenario,
    surfaceId: 'archive',
    compressorId: speed.scenario,
    codecId: -99,
  }
  const entry = archiveRows.find(e => e.format === speed.scenario && sameSourceCase(e, speed))
  const originalBytes = entry?.originalBytes ?? speed.decodedBytes
  const encodeMs = entry?.encodeMs ?? 0

  return {
    codecId: meta.codecId,
    kind: 'archive',
    codecName: meta.label,
    outerCompression: meta.compressorId,
    source: speed.source,
    sourceId: speed.sourceId,
    chunkCount: speed.chunkCount,
    chunkIndex: speed.chunkIndex,
    condition: speed.condition,
    encodeMs: round1(encodeMs),
    speedMs: speed.totalMs,
    fetchMs: speed.fetchMs,
    decodeTailMs: speed.decodeMs,
    decodeMs: speed.decodeMs,
    roundTripMs: speed.totalMs,
    tokenBytes: speed.transferBytes,
    originalBytes,
    ratio: ratio(speed.transferBytes, originalBytes),
    throughputMBps: speed.throughputMBps,
    isStreaming: false,
    isBrowserSafe: true,
    surfaceId: meta.surfaceId,
    compressorId: meta.compressorId,
    pathTaken: 'batch',
  }
}

function sameSourceCase(
  row: Pick<
    EncodeTimeEntry | ArchiveTimeEntry,
    'source' | 'sourceId' | 'chunkCount' | 'chunkIndex'
  >,
  speed: Pick<SpeedResultRow, 'source' | 'sourceId' | 'chunkCount' | 'chunkIndex'>,
): boolean {
  return (
    row.source === speed.source &&
    row.sourceId === speed.sourceId &&
    row.chunkCount === speed.chunkCount &&
    row.chunkIndex === speed.chunkIndex
  )
}

function ratio(size: number, originalBytes: number): number {
  return originalBytes > 0 ? Math.round((size / originalBytes) * 10000) / 10000 : 0
}

function round1(ms: number): number {
  return Math.round(ms * 10) / 10
}
