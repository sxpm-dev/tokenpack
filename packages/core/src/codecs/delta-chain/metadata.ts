import type { CodecMetadata } from '../types'

export const deltaChainMetadata: CodecMetadata = {
  pixelLayout: 'RGB · chained deltas',
  writeStyle: 'sequential chain',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'yes',
  streamFriendly: 'yes',
  approxRatio: '15-18% with deflate/brotli',
  description:
    'Chains deltas across the byte stream and produced the fastest passing decode in the baseline run.',
}

export const deltaChainInfo = { id: 8, name: 'delta-chain', metadata: deltaChainMetadata } as const
