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
  chunks?: ReadonlyArray<RouterChunkPlan>
  variant?: RouterTokenManifest['variant']
  targetChunkBytes?: number
  maxSegmentsPerFile?: number
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
