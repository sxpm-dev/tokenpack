// PixelRangeAlgorithm — base for algorithms whose pack data lives in an
// image-format ancillary chunk (PNG `tpAK`, WebP `TPAK`, AVIF `tpak`) instead
// of inside the pixel stream. The artifact is a real image with arbitrary
// visible content (decoration); the pack data rides as a side channel.
//
// Range-fetch friendly: pack-region offsets are stable file-byte positions,
// so a consumer can `Range: bytes=A-B` to pull a specific region from a
// remote artifact without decoding pixels.

import {
  colorOption,
  enumOption,
  numberOption,
  type OptionsSchema,
} from '../components/options'
import type { DecorationConfig, DecorationKind } from '../surfaces/decoration-renderer'
import { renderDecoration } from '../surfaces/decoration-renderer'

import { AbstractAlgorithm, type AlgorithmOptions, type DecodeOptions } from './types'

interface DecorationOpts {
  kind?: DecorationKind
  size?: number
  colorFrom?: string | [number, number, number]
  colorTo?: string | [number, number, number]
}

interface PixelRangeOpts extends AlgorithmOptions {
  decoration?: DecorationOpts | DecorationConfig
}

export abstract class PixelRangeAlgorithm extends AbstractAlgorithm {
  static override get optionsSchema(): OptionsSchema {
    const base = super.optionsSchema

    return {
      ...base,
      'decoration.kind': enumOption(
        ['placeholder', 'gradient', 'data-art'] as const,
        'gradient',
        { label: 'Decoration', description: 'Visible image rendered alongside the pack data.' },
      ),
      'decoration.size': numberOption([1, 512], 64, {
        label: 'Decoration size',
        description: 'Side length in pixels of the decorative image.',
        step: 1,
      }),
      'decoration.colorFrom': colorOption('#ff5050', {
        label: 'Color (from)',
        description: 'Solid fill (placeholder) or gradient start (gradient).',
      }),
      'decoration.colorTo': {
        ...colorOption('#5050ff', {
          label: 'Color (to)',
          description: 'Gradient end color.',
        }),
        dependsOn: { key: 'decoration.kind', value: 'gradient' },
      },
    }
  }

  /** Splice the data into a custom chunk inside the rendered image bytes. */
  protected abstract embedData(imageBytes: Buffer, packBytes: Uint8Array): Buffer

  /** Scan the artifact bytes for the custom chunk and return its body. */
  protected abstract extractData(artifactBytes: Buffer): Uint8Array

  async encode(input: Uint8Array, opts: AlgorithmOptions = {}): Promise<Buffer> {
    const merged: PixelRangeOpts = { ...this.opts, ...opts }
    const decoration = resolveDecoration(merged.decoration)

    // 'data-art' renders the pack bytes themselves as a visible picture.
    // Caller can pre-supply `dataArtPixels`; otherwise we synthesize a square
    // RGB image from the input bytes here so the dashboard form (which only
    // sets `kind: 'data-art'`) doesn't need to know about pixel layout.
    if (decoration.kind === 'data-art' && !decoration.dataArtPixels) {
      decoration.dataArtPixels = bytesToDataArt(input)
    }
    const decorationPixels = renderDecoration(decoration)
    const imageBytes = await this.surface.writeBuffer(decorationPixels)

    return this.embedData(imageBytes, input)
  }

  async decode(source: Buffer | Uint8Array, _opts: DecodeOptions = {}): Promise<Buffer> {
    const buf = Buffer.isBuffer(source)
      ? source
      : Buffer.from(source.buffer, source.byteOffset, source.byteLength)
    const data = this.extractData(buf)

    return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  }

  override canHandle(buffer: Buffer, _ext?: string): boolean {
    if (!buffer || buffer.length < 64) return false
    try {
      this.extractData(buffer)

      return true
    } catch {
      return false
    }
  }
}

function resolveDecoration(opts: DecorationOpts | DecorationConfig | undefined): DecorationConfig {
  return {
    kind: opts?.kind ?? 'gradient',
    size: opts?.size ?? 64,
    colorFrom: toRgb(opts?.colorFrom) ?? [255, 80, 80],
    colorTo: toRgb(opts?.colorTo) ?? [80, 80, 255],
    dataArtPixels: (opts as DecorationConfig | undefined)?.dataArtPixels,
  }
}

function toRgb(v: unknown): [number, number, number] | undefined {
  if (Array.isArray(v) && v.length === 3) return [v[0] as number, v[1] as number, v[2] as number]
  if (typeof v === 'string') return hexToRgb(v)

  return undefined
}

/**
 * Render the input bytes as a square RGB image. Each pixel = 3 input bytes;
 * the image side is `ceil(sqrt(input.length / 3))`. Trailing pixels (when
 * input.length isn't a multiple of `side² × 3`) are zero-filled.
 */
function bytesToDataArt(input: Uint8Array): import('../surfaces/types').SurfacePixels {
  const pixelCount = Math.ceil(input.length / 3)
  const side = Math.max(1, Math.ceil(Math.sqrt(pixelCount)))
  const pixels = new Uint8Array(side * side * 3)

  pixels.set(input.subarray(0, Math.min(input.length, pixels.length)), 0)

  return { pixels, width: side, height: side, fileChannels: 3 }
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized
          .split('')
          .map(c => `${c}${c}`)
          .join('')
      : normalized.padEnd(6, '0').slice(0, 6),
    16,
  )

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}
