import type { CodecMetadata } from '../types'

export const interleavedMetadata: CodecMetadata = {
  pixelLayout: 'RGB · pairs swapped',
  writeStyle: 'pair groups',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'yes',
  streamFriendly: 'no',
  approxRatio: '15-18% with deflate/brotli',
  description:
    'Swaps adjacent pixel pairs for light visual obfuscation while preserving benchmark speed.',
  family: 'legacy',
  familyLabel: 'Legacy',
}

export const interleavedInfo = {
  id: 2,
  name: 'interleaved',
  metadata: interleavedMetadata,
} as const
