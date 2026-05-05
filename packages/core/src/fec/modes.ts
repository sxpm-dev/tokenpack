import type { FecMode } from './types'

export interface FecModeInfo {
  id: FecMode
  label: string
  headerLevel: number
  parityBytes: number
  overheadPct: number
  recoverableBytesPerBlock: number
  description: string
}

// Mode catalog (client-safe — no node deps). Mirrors compressors/modes.ts.
export const FEC_MODE_INFOS: readonly FecModeInfo[] = [
  {
    id: 'none',
    label: 'None',
    headerLevel: 0,
    parityBytes: 0,
    overheadPct: 0,
    recoverableBytesPerBlock: 0,
    description: 'No error correction (default).',
  },
  {
    id: 'rs-5',
    label: 'Reed-Solomon · light',
    headerLevel: 1,
    parityBytes: 12,
    overheadPct: 4.9,
    recoverableBytesPerBlock: 6,
    description: '+5% size · recovers 6 bytes per 255-byte block (~2 bad pixels).',
  },
  {
    id: 'rs-15',
    label: 'Reed-Solomon · medium',
    headerLevel: 2,
    parityBytes: 38,
    overheadPct: 17.5,
    recoverableBytesPerBlock: 19,
    description: '+17% size · recovers 19 bytes per 255-byte block (~6 bad pixels).',
  },
  {
    id: 'rs-25',
    label: 'Reed-Solomon · heavy',
    headerLevel: 3,
    parityBytes: 64,
    overheadPct: 33.5,
    recoverableBytesPerBlock: 32,
    description: '+33% size · recovers 32 bytes per 255-byte block (~10 bad pixels).',
  },
]

export const FEC_MODES: readonly FecMode[] = FEC_MODE_INFOS.map(m => m.id)
