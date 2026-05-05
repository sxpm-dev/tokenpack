import type { CodecMetadata } from '../types'

export const bitshuffleMetadata: CodecMetadata = {
  pixelLayout: 'RGB · bit-shuffled',
  writeStyle: 'bit lanes',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'yes',
  streamFriendly: 'yes',
  approxRatio: '15-18% with deflate/brotli',
  description:
    'Shuffles bit positions across bytes so general-purpose compressors see longer repeated patterns.',
  requiredChannels: 3,
}

export const bitshuffleInfo = { id: 15, name: 'bitshuffle', metadata: bitshuffleMetadata } as const
