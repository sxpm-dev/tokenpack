import type { PackBuilder } from '../pack-builder'

export const ROUTER_TOKEN_ID = '__router'
export const ROUTER_TOKEN_FILE = 'router.png'
export const ROUTER_MANIFEST_PATH = 'router.json'

export interface RouterTokenManifest {
  version: 1
  variant?: {
    id: string
    algo: string
    channels: 3 | 4
    loadMode: string
    packCompressor: string
  }
  chunks: RouterChunkManifestEntry[]
  files: RouterFileManifestEntry[]
}

export interface RouterChunkManifestEntry {
  id: string
  href: string
  byteLength?: number
  payloadOffset?: number
}

export interface RouterFileManifestEntry {
  url: string
  path: string
  status: number
  headers: Readonly<Record<string, string>>
  compressor?: string
  level?: number
  byteLength: number
  compressedByteLength?: number
  segments: RouterFileSegment[]
}

export interface RouterFileSegment {
  chunkId: string
  offset: number
  length: number
  fileOffset?: number
}

export interface RouterSourceFile {
  url: string
  path: string
  bytes: Uint8Array
  status?: number
  headers?: Readonly<Record<string, string>>
}

export interface RouterChunkPlan {
  id: string
  href?: string
  files: ReadonlyArray<RouterSourceFile>
}

export interface RouterBuildOptions {
  files?: ReadonlyArray<RouterSourceFile>
  chunks?: ReadonlyArray<RouterChunkPlan>
  variant?: RouterTokenManifest['variant']
  targetChunkBytes?: number
  maxSegmentsPerFile?: number
  /**
   * Router chunk byte layout. `tiny-files-clustered` preserves manifest file
   * order but writes small files contiguously in chunk payloads so runtime range
   * coalescing can fetch small-file bursts with fewer requests.
   */
  chunkLayout?: 'source-order' | 'tiny-files-clustered'
  /** Compressed file size considered tiny for router chunk layout. */
  tinyFileBytes?: number
  /**
   * A compressed file is split only when it is larger than
   * `targetChunkBytes * minSplitRatio`. Raising this favors fewer chunk PNGs;
   * lowering it favors finer-grained parallel range/chunk fetches.
   */
  minSplitRatio?: number
  fileCompressor?: string
}

export interface RouterTokenPack {
  readonly kind: 'router-token-pack'
  readonly source: PackBuilder
  readonly options: RouterBuildOptions
}

export interface PlannedRouterChunk {
  id: string
  href: string
  bytes: Uint8Array
}

export interface PlannedRouterBundle {
  manifest: RouterTokenManifest
  chunks: PlannedRouterChunk[]
}
