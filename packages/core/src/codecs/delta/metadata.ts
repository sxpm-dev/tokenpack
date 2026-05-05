import type { CodecMetadata } from '../types'

export const deltaMetadata: CodecMetadata = {
  pixelLayout: 'RGB · delta bytes',
  writeStyle: 'sequential delta',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'yes',
  streamFriendly: 'yes',
  approxRatio: '15-18% with brotli',
  description:
    'Stores byte deltas between neighbors, which can improve compression on smooth or structured data.',
}

export const deltaInfo = { id: 5, name: 'delta', metadata: deltaMetadata } as const
