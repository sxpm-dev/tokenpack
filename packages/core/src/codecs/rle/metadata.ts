import type { CodecMetadata } from '../types'

export const rleMetadata: CodecMetadata = {
  pixelLayout: 'RGB · run packets',
  writeStyle: 'run groups',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'yes',
  streamFriendly: 'no',
  approxRatio: '15-18% with brotli',
  description:
    'Run-length preprocessing that stays within the encode, decode, and ratio gate with brotli.',
}

export const rleInfo = { id: 9, name: 'rle', metadata: rleMetadata } as const
