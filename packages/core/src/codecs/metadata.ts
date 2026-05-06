import { bitplaneInfo } from './bitplane/metadata'
import { bitshuffleInfo } from './bitshuffle/metadata'
import { deltaInfo } from './delta/metadata'
import { deltaChainInfo } from './delta-chain/metadata'
import { interleavedInfo } from './interleaved/metadata'
import { linearInfo } from './linear/metadata'
import { predictInfo } from './predict/metadata'
import { rleInfo } from './rle/metadata'
import type { CodecMetadata } from './types'
import { xorInfo } from './xor/metadata'
import { zstdpixInfo } from './zstdpix-metadata'

export interface CodecInfo {
  id: number
  name: string
  metadata: CodecMetadata
}

export const CODEC_INFOS: readonly CodecInfo[] = [
  linearInfo,
  interleavedInfo,
  bitplaneInfo,
  deltaInfo,
  xorInfo,
  deltaChainInfo,
  rleInfo,
  predictInfo,
  bitshuffleInfo,
  zstdpixInfo,
]
