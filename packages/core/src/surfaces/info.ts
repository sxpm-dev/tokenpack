import type { ImageFormat } from '../types'
import type { SurfaceId } from './types'

export interface SurfaceInfo {
  id: SurfaceId
  label: string
  format: ImageFormat
  extension: string
  mimeType: string
  streamable: boolean
  preservesAlpha: boolean
  maxBpp: 1 | 2 | 3 | 4
}

export const SURFACE_INFOS: readonly SurfaceInfo[] = [
  {
    id: 'png',
    label: 'PNG',
    format: 'png',
    extension: '.png',
    mimeType: 'image/png',
    streamable: false,
    preservesAlpha: true,
    maxBpp: 4,
  },
  {
    id: 'png-stream',
    label: 'Streaming PNG',
    format: 'png',
    extension: '.png',
    mimeType: 'image/png',
    streamable: true,
    preservesAlpha: true,
    maxBpp: 4,
  },
  {
    id: 'webp',
    label: 'WebP',
    format: 'webp',
    extension: '.webp',
    mimeType: 'image/webp',
    streamable: false,
    preservesAlpha: false,
    maxBpp: 3,
  },
  {
    id: 'avif',
    label: 'AVIF',
    format: 'avif',
    extension: '.avif',
    mimeType: 'image/avif',
    streamable: false,
    preservesAlpha: true,
    maxBpp: 4,
  },
]

export const IMAGE_FORMATS: readonly ImageFormat[] = ['png', 'webp', 'avif']
