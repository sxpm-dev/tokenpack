import type { CodecMetadata } from '../types'

export const linearMetadata: CodecMetadata = {
  pixelLayout: 'RGB · 3 bytes/px',
  writeStyle: 'sequential',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'yes',
  streamFriendly: 'yes',
  approxRatio: '15-18% with deflate/brotli',
  description:
    'Direct byte-to-pixel copy. Baseline layout with strong results once paired with outer compression.',
}

export const linearInfo = { id: 0, name: 'linear', metadata: linearMetadata } as const
