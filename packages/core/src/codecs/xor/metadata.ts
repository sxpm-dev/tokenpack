import type { CodecMetadata } from '../types'

export const xorMetadata: CodecMetadata = {
  pixelLayout: 'RGB · xor deltas',
  writeStyle: 'sequential xor',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'yes',
  streamFriendly: 'yes',
  approxRatio: '15-18% with deflate/brotli',
  description: 'Stores XOR deltas between neighboring bytes for fast reversible preprocessing.',
}

export const xorInfo = { id: 6, name: 'xor', metadata: xorMetadata } as const
