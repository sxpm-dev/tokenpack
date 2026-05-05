import type { CodecMetadata } from '../types'

export const bitplaneMetadata: CodecMetadata = {
  pixelLayout: 'RGB · bit-plane ordered',
  writeStyle: 'plane groups',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'yes',
  streamFriendly: 'no',
  approxRatio: '15-18% with deflate/brotli',
  description:
    'Writes bytes by bit significance to expose compressible planes to the outer compressor.',
  family: 'legacy',
  familyLabel: 'Legacy',
}

export const bitplaneInfo = { id: 4, name: 'bitplane', metadata: bitplaneMetadata } as const
