import { CODEC_INFOS, type CodecInfo } from '../codecs/metadata'
import type { CodecMetadata, Friendliness } from '../codecs/types'
import { COMPRESSION_MODE_INFOS, COMPRESSION_MODES } from '../compressors/modes'
import type { CompressionMode } from '../compressors/types'
import { FEC_MODE_INFOS, FEC_MODES } from '../fec/modes'
import { type Preset, PRESETS } from '../presets'
import { IMAGE_FORMATS, SURFACE_INFOS } from '../surfaces/info'
import type { ImageFormat } from '../types'

export interface AlgorithmInfo {
  id: number
  name: string
  description: string
  pixelLayout: string
  writeStyle: string
  dependencies: string
  beFriendly: Friendliness
  feFriendly: Friendliness
  streamFriendly: Friendliness
  approxRatio: string
  requiredChannels: 1 | 2 | 3 | 4 | null
  options: string[]
}

function describeOptions(meta: CodecMetadata): string[] {
  const channels = meta.requiredChannels ? `channels: ${meta.requiredChannels}` : 'channels: 1-4'
  const families = Array.from(
    new Set(COMPRESSION_MODE_INFOS.filter(m => m.id !== 'none').map(m => m.id.split('-')[0])),
  ).join(' / ')

  return [channels, `outer compression: none / ${families}`]
}

export function buildAlgorithmInfo(info: CodecInfo): AlgorithmInfo {
  return {
    id: info.id,
    name: info.name,
    description: info.metadata.description,
    pixelLayout: info.metadata.pixelLayout,
    writeStyle: info.metadata.writeStyle,
    dependencies: info.metadata.dependencies,
    beFriendly: info.metadata.beFriendly,
    feFriendly: info.metadata.feFriendly,
    streamFriendly: info.metadata.streamFriendly,
    approxRatio: info.metadata.approxRatio,
    requiredChannels: info.metadata.requiredChannels ?? null,
    options: describeOptions(info.metadata),
  }
}

export const ALGORITHM_INFOS: readonly AlgorithmInfo[] = CODEC_INFOS.map(buildAlgorithmInfo)

export const PRESET_INFOS: readonly Preset[] = PRESETS

export interface DefaultPreset {
  name: string
  label: string
  description: string
  streamable: boolean
  options: {
    algo: string
    compressionMode: CompressionMode
    channels: 1 | 2 | 3 | 4
    format: ImageFormat
    streaming: boolean
  }
}

export const DEFAULT_PRESETS: readonly DefaultPreset[] = [
  {
    name: 'max',
    label: 'Max compression',
    description: 'brotli-11 · WebP · 3 bpp',
    streamable: false,
    options: {
      algo: 'linear',
      compressionMode: 'brotli-11',
      channels: 3,
      format: 'webp',
      streaming: false,
    },
  },
  {
    name: 'streamable',
    label: 'Max streamable',
    description: 'brotli-6 · PNG · 4 bpp',
    streamable: true,
    options: {
      algo: 'linear',
      compressionMode: 'brotli-6',
      channels: 4,
      format: 'png',
      streaming: true,
    },
  },
]

export {
  COMPRESSION_MODE_INFOS,
  COMPRESSION_MODES,
  FEC_MODE_INFOS,
  FEC_MODES,
  IMAGE_FORMATS,
  SURFACE_INFOS,
}
