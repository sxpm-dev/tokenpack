export type Throttle = 'local' | 'fast-cdn' | 'average' | 'slow'
export type Encoding = 'raw' | 'deflate' | 'brotli'
export type VariantKind =
  | 'native-full'
  | 'token-full'
  | 'diff-apply'
  | 'range-changed-fetch'
  | 'range-changed-stream'

export interface TokenVariant {
  id: string
  algo: string
  channels: number
  group: 'fetch' | 'stream'
  streamable: boolean
  rangePack?: boolean
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
    encoding: Encoding
    file: string
    bytes: number
    sha256: string
  }>
  tokens: Array<{
    id: string
    algo: string
    channels: number
    group: 'fetch' | 'stream'
    streamable: boolean
    baseBytes: number
    nextBytes: number
    diffBytes: number
    rangePackBytes?: number
  }>
}

export interface ApplyDiffManifest {
  available: boolean
  hint?: string
  generatedAt?: string
  sizesKB?: number[]
  changeRatesPct?: number[]
  fileCount?: number
  encodings?: Encoding[]
  tokenVariants: TokenVariant[]
  cases: ApplyDiffCase[]
}

export interface Sample {
  ttfbMs: number
  transferMs: number
  decodeMs: number
  applyMs: number
  totalMs: number
  wireBytes: number
}

export interface RowResult {
  id: string
  label: string
  kind: VariantKind
  tokenId?: string
  iterations: number
  median: Sample
  p95: Sample
  perRunTotal: number[]
  verifyHash: string | null
  verifyBytes: number
  error?: string
}

export interface Variant {
  id: string
  label: string
  kind: VariantKind
  token?: TokenVariant
  encoding?: Encoding
}
