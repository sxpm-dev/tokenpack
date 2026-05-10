import fs from 'fs'
import type { NextRequest } from 'next/server'
import path from 'path'

export type ApplyDiffEncoding = 'raw' | 'deflate' | 'brotli'
export type ApplyDiffTokenGroup = 'fetch' | 'stream'

export interface ApplyDiffTokenFixture {
  id: string
  algo: string
  channels: number
  group: ApplyDiffTokenGroup
  streamable: boolean
  baseFile: string
  nextFile: string
  diffFile: string
  baseBytes: number
  nextBytes: number
  diffBytes: number
  baseSha256: string
  nextSha256: string
  diffSha256: string
  rangePackFile?: string
  rangePackBytes?: number
  rangePackSha256?: string
}

export interface ApplyDiffCase {
  id: string
  sizeKB: number
  changeRatePct: number
  fileCount: number
  changedFileCount: number
  changedPaths: string[]
  baseOriginalBytes: number
  nextOriginalBytes: number
  changedOriginalBytes: number
  baseTreeSha256: string
  nextTreeSha256: string
  native: Array<{
    encoding: ApplyDiffEncoding
    file: string
    bytes: number
    sha256: string
  }>
  tokens: ApplyDiffTokenFixture[]
}

export interface ApplyDiffManifest {
  generatedAt: string
  sizesKB: number[]
  changeRatesPct: number[]
  fileCount: number
  encodings: ApplyDiffEncoding[]
  tokenVariants: Array<{
    id: string
    algo: string
    channels: number
    group: ApplyDiffTokenGroup
    streamable: boolean
    rangePack?: boolean
  }>
  cases: ApplyDiffCase[]
}

export const APPLY_DIFF_FIXTURES = path.join(process.cwd(), 'benchmark-fixtures', 'apply-diff')

export function readApplyDiffManifest(): ApplyDiffManifest | null {
  const manifestPath = path.join(APPLY_DIFF_FIXTURES, 'manifest.json')

  if (!fs.existsSync(manifestPath)) return null

  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as ApplyDiffManifest
}

export function applyDiffFixturePath(file: string): string {
  const normalized = path.normalize(file)

  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    throw new Error(`invalid fixture path: ${file}`)
  }

  return path.join(APPLY_DIFF_FIXTURES, normalized)
}

export function findCase(manifest: ApplyDiffManifest, id: string | null): ApplyDiffCase | null {
  if (id) return manifest.cases.find(item => item.id === id) ?? null

  return manifest.cases[0] ?? null
}

export function findNativeFixture(
  item: ApplyDiffCase,
  encoding: ApplyDiffEncoding,
): ApplyDiffCase['native'][number] | null {
  return item.native.find(fixture => fixture.encoding === encoding) ?? null
}

export function findTokenFixture(
  item: ApplyDiffCase,
  tokenId: string | null,
): ApplyDiffTokenFixture | null {
  if (tokenId) return item.tokens.find(fixture => fixture.id === tokenId) ?? null

  return item.tokens[0] ?? null
}

export function readParam(req: NextRequest, name: string): string | null {
  return req.nextUrl.searchParams.get(name)
}
