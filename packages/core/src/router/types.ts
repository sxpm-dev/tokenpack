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
  /**
   * Chunk encoding format. Absent = legacy per-file deflate frames stored
   * back-to-back in the chunk payload; each file carries its own `compressor`
   * and decompresses independently from its segment bytes. 'concat-deflate' =
   * the chunk payload is a single deflate stream that inflates to the
   * concatenation of all file bytes inside this chunk; file segments point at
   * offsets in the inflated buffer and have no per-file compressor.
   */
  kind?: 'concat-deflate'
  /** Inflated payload length for concat-deflate chunks; absent otherwise. */
  uncompressedByteLength?: number
  /** Compressor used for concat-deflate chunks; absent otherwise. */
  compressor?: string
  /** Compressor level for concat-deflate chunks; absent otherwise. */
  level?: number
  /**
   * Speculative prefetch ordering hint. Lower = fetch earlier. Set by the
   * encoder when `bootFiles` is passed to RouterBuildOptions — derived from
   * the position of this chunk's earliest-listed file in that URL list.
   * Chunks containing none of the boot files don't get a priority and are
   * skipped by priority-ordered prefetch.
   */
  priority?: number
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
  /**
   * URLs of files the consumer wants prioritized for cold-path delivery, in
   * priority order (most-important first). The encoder doesn't reorder
   * chunks based on this — it just stamps a `priority` number on each chunk
   * equal to the lowest position any of its files holds in the list. The
   * runtime can then prefetch chunks in ascending priority for cold start.
   *
   * Generic — the encoder doesn't care HOW the consumer derived the order
   * (e.g., from a prior benchmark report's cold-path access trace, or from
   * a curated boot-critical list in their build pipeline).
   */
  bootFiles?: readonly string[]
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
  kind?: 'concat-deflate'
  uncompressedByteLength?: number
  compressor?: string
  level?: number
  priority?: number
}

export interface PlannedRouterBundle {
  manifest: RouterTokenManifest
  chunks: PlannedRouterChunk[]
}
