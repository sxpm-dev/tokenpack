import type { CompressionMode } from './types'

export interface CompressionModeInfo {
  id: CompressionMode
  label: string
  headerLevel: number
  streamableDecode: boolean
  requiresFullHeader: boolean
}

export const COMPRESSION_MODE_INFOS: readonly CompressionModeInfo[] = [
  { id: 'none', label: 'None', headerLevel: 0, streamableDecode: true, requiresFullHeader: false },
  {
    id: 'deflate-1',
    label: 'Deflate 1',
    headerLevel: 3,
    streamableDecode: true,
    requiresFullHeader: true,
  },
  {
    id: 'deflate-6',
    label: 'Deflate 6',
    headerLevel: 1,
    streamableDecode: true,
    requiresFullHeader: true,
  },
  {
    id: 'deflate-9',
    label: 'Deflate 9',
    headerLevel: 4,
    streamableDecode: true,
    requiresFullHeader: true,
  },
  {
    id: 'brotli-4',
    label: 'Brotli 4',
    headerLevel: 5,
    streamableDecode: true,
    requiresFullHeader: true,
  },
  {
    id: 'brotli-6',
    label: 'Brotli 6',
    headerLevel: 6,
    streamableDecode: true,
    requiresFullHeader: true,
  },
  {
    id: 'brotli-11',
    label: 'Brotli 11',
    headerLevel: 2,
    streamableDecode: true,
    requiresFullHeader: false,
  },
]

export const COMPRESSION_MODES: readonly CompressionMode[] = COMPRESSION_MODE_INFOS.map(m => m.id)
