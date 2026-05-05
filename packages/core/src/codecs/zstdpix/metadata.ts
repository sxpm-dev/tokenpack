import type { CodecMetadata } from '../types'

export const zstdpixMetadata: CodecMetadata = {
  pixelLayout: 'RGB · compressed blocks',
  writeStyle: 'block framed',
  dependencies: 'Node zlib / optional zstd support',
  beFriendly: 'yes',
  feFriendly: 'no',
  streamFriendly: 'no',
  approxRatio: '15-19% across passing modes',
  description:
    'Node-oriented compression codec that passed the react-dom dev gate, including an uncompressed outer mode.',
  family: 'C',
  familyLabel: 'High-Ratio Node-Only',
  requiredChannels: 3,
}

export const zstdpixInfo = { id: 21, name: 'zstdpix', metadata: zstdpixMetadata } as const
