// PixelRangeAlgorithm — base for algorithms whose pack data lives in an
// image-format ancillary chunk (PNG `tpAK`, WebP `TPAK`, AVIF `tpak`) instead
// of inside the pixel stream. The artifact is a real image with arbitrary
// visible content (decoration); the pack data rides as a side channel.
//
// Range-fetch friendly: pack-region offsets are stable file-byte positions,
// so a consumer can `Range: bytes=A-B` to pull a specific region from a
// remote artifact without decoding pixels.

import { colorOption, enumOption, numberOption, type OptionsSchema } from '../components/options'
import type { DecorationConfig, DecorationKind } from '../surfaces/decoration-renderer'
import { renderDecoration } from '../surfaces/decoration-renderer'
import { AbstractAlgorithm, type AlgorithmOptions, type DecodeOptions } from './types'

const TPAK_BODY_MAGIC = Buffer.from('TPK1', 'ascii')
const TPAK_BODY_HEADER_BYTES = TPAK_BODY_MAGIC.length + 2 + 1 + 4

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
      'decoration.kind': enumOption(['placeholder', 'gradient', 'data-art'] as const, 'gradient', {
        label: 'Decoration',
        description: 'Visible image rendered alongside the pack data.',
      }),
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
    const raw = Buffer.from(input.buffer, input.byteOffset, input.byteLength)
    const compressed = await this.compressor.compress(raw)
    const algorithmId = (this.constructor as unknown as { id: number }).id
    const packBytes = wrapTpakBody(
      algorithmId,
      compressed.level,
      compressed.uncompressedLength || raw.length,
      compressed.data,
    )

    // 'data-art' renders the pack bytes themselves as a visible picture.
    // Caller can pre-supply `dataArtPixels`; otherwise we synthesize a square
    // RGB image from the input bytes here so the dashboard form (which only
    // sets `kind: 'data-art'`) doesn't need to know about pixel layout.
    if (decoration.kind === 'data-art' && !decoration.dataArtPixels) {
      decoration.dataArtPixels = bytesToDataArt(raw)
    }
    const decorationPixels = renderDecoration(decoration)
    const imageBytes = await this.surface.writeBuffer(decorationPixels)

    return this.embedData(imageBytes, packBytes)
  }

  async decode(source: Buffer | Uint8Array, _opts: DecodeOptions = {}): Promise<Buffer> {
    const buf = Buffer.isBuffer(source)
      ? source
      : Buffer.from(source.buffer, source.byteOffset, source.byteLength)
    const data = this.extractData(buf)
    const body = unwrapTpakBody(data)

    if (!body) {
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    }

    const algorithmId = (this.constructor as unknown as { id: number }).id

    if (body.algorithmId !== algorithmId) {
      throw new Error(
        `tpAK payload belongs to algorithm id ${body.algorithmId}, not ${algorithmId}`,
      )
    }

    const decoded = await this.compressor.decompress(body.payload, {
      level: body.compressionLevel,
      uncompressedLength: body.uncompressedLength,
    })

    if (body.uncompressedLength > 0 && decoded.length !== body.uncompressedLength) {
      throw new Error(
        `tpAK payload decoded to ${decoded.length} bytes; expected ${body.uncompressedLength}`,
      )
    }

    return decoded
  }

  override decodeStream(
    source: ReadableStream<Uint8Array>,
    opts: DecodeOptions = {},
  ): ReadableStream<Uint8Array> {
    const algorithm = this

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const tpakBody = extractPngChunkDataStream(source, 'tpAK')
          const body = await unwrapTpakBodyStream(tpakBody)
          const algorithmId = (algorithm.constructor as unknown as { id: number }).id

          if (body.algorithmId !== null && body.algorithmId !== algorithmId) {
            throw new Error(
              `tpAK payload belongs to algorithm id ${body.algorithmId}, not ${algorithmId}`,
            )
          }

          const decoded = algorithm.compressor.decompressWebStream(body.payload, {
            level: body.compressionLevel,
            uncompressedLength: body.uncompressedLength,
          })
          const reader = decoded.getReader()
          let total = 0
          let first = true

          while (true) {
            const { done, value } = await reader.read()

            if (done) break
            if (!value) continue
            total += value.byteLength
            if (first) {
              first = false
              opts.onFirstDecodedChunk?.(value)
            }
            controller.enqueue(value)
          }
          if (body.uncompressedLength > 0 && total !== body.uncompressedLength) {
            throw new Error(
              `tpAK payload decoded to ${total} bytes; expected ${body.uncompressedLength}`,
            )
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })
  }

  override canHandle(buffer: Buffer, _ext?: string): boolean {
    if (!buffer || buffer.length < 64) return false
    try {
      const body = unwrapTpakBody(this.extractData(buffer))

      if (!body) return false
      const algorithmId = (this.constructor as unknown as { id: number }).id

      return body.algorithmId === algorithmId
    } catch {
      return false
    }
  }
}

interface TpakStreamBody {
  algorithmId: number | null
  compressionLevel: number
  uncompressedLength: number
  payload: ReadableStream<Uint8Array>
}

function wrapTpakBody(
  algorithmId: number,
  compressionLevel: number,
  uncompressedLength: number,
  payload: Buffer,
): Buffer {
  const header = Buffer.alloc(TPAK_BODY_HEADER_BYTES)

  TPAK_BODY_MAGIC.copy(header, 0)
  header.writeUInt16BE(algorithmId, TPAK_BODY_MAGIC.length)
  header.writeUInt8(compressionLevel & 0xff, TPAK_BODY_MAGIC.length + 2)
  header.writeUInt32BE(uncompressedLength >>> 0, TPAK_BODY_MAGIC.length + 3)

  return Buffer.concat([header, payload])
}

function unwrapTpakBody(data: Uint8Array): {
  algorithmId: number
  compressionLevel: number
  uncompressedLength: number
  payload: Buffer
} | null {
  const buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)

  if (buf.length < TPAK_BODY_HEADER_BYTES) return null
  if (!buf.subarray(0, TPAK_BODY_MAGIC.length).equals(TPAK_BODY_MAGIC)) return null

  return {
    algorithmId: buf.readUInt16BE(TPAK_BODY_MAGIC.length),
    compressionLevel: buf.readUInt8(TPAK_BODY_MAGIC.length + 2),
    uncompressedLength: buf.readUInt32BE(TPAK_BODY_MAGIC.length + 3),
    payload: buf.subarray(TPAK_BODY_HEADER_BYTES),
  }
}

async function unwrapTpakBodyStream(stream: ReadableStream<Uint8Array>): Promise<TpakStreamBody> {
  const reader = new StreamByteReader(stream)
  const first = await reader.readExactly(TPAK_BODY_HEADER_BYTES)

  if (!startsWith(first, TPAK_BODY_MAGIC)) {
    return {
      algorithmId: null,
      compressionLevel: 0,
      uncompressedLength: 0,
      payload: reader.readRemainderStream(first),
    }
  }

  return {
    algorithmId: (first[TPAK_BODY_MAGIC.length] << 8) | first[TPAK_BODY_MAGIC.length + 1],
    compressionLevel: first[TPAK_BODY_MAGIC.length + 2],
    uncompressedLength:
      first[TPAK_BODY_MAGIC.length + 3] * 0x1000000 +
      (first[TPAK_BODY_MAGIC.length + 4] << 16) +
      (first[TPAK_BODY_MAGIC.length + 5] << 8) +
      first[TPAK_BODY_MAGIC.length + 6],
    payload: reader.readRemainderStream(),
  }
}

function extractPngChunkDataStream(
  source: ReadableStream<Uint8Array>,
  chunkType: string,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = new StreamByteReader(source)

      try {
        const sig = await reader.readExactly(8)

        if (
          sig[0] !== 0x89 ||
          sig[1] !== 0x50 ||
          sig[2] !== 0x4e ||
          sig[3] !== 0x47 ||
          sig[4] !== 0x0d ||
          sig[5] !== 0x0a ||
          sig[6] !== 0x1a ||
          sig[7] !== 0x0a
        ) {
          throw new Error('not a PNG')
        }

        while (true) {
          const header = await reader.readExactly(8)
          const length = header[0] * 0x1000000 + (header[1] << 16) + (header[2] << 8) + header[3]
          const type = String.fromCharCode(header[4], header[5], header[6], header[7])

          if (type === chunkType) {
            let remaining = length

            while (remaining > 0) {
              const chunk = await reader.readUpTo(remaining)

              remaining -= chunk.byteLength
              controller.enqueue(chunk)
            }
            controller.close()
            await reader.cancel()

            return
          }

          await reader.skip(length + 4)
          if (type === 'IEND') throw new Error(`no ${chunkType} chunk found in PNG`)
        }
      } catch (error) {
        controller.error(error)
        await reader.cancel().catch(() => undefined)
      }
    },
  })
}

class StreamByteReader {
  private readonly reader: ReadableStreamDefaultReader<Uint8Array>
  private buffered: Uint8Array<ArrayBufferLike> = new Uint8Array(0)

  constructor(stream: ReadableStream<Uint8Array>) {
    this.reader = stream.getReader()
  }

  async readExactly(size: number): Promise<Uint8Array> {
    const out = new Uint8Array(size)
    let offset = 0

    while (offset < size) {
      const chunk = await this.readUpTo(size - offset)

      out.set(chunk, offset)
      offset += chunk.byteLength
    }

    return out
  }

  async readUpTo(size: number): Promise<Uint8Array> {
    while (this.buffered.byteLength === 0) {
      const { done, value } = await this.reader.read()

      if (done) throw new Error('PNG stream ended unexpectedly')
      if (value && value.byteLength > 0) this.buffered = value
    }

    const take = Math.min(size, this.buffered.byteLength)
    const out = this.buffered.subarray(0, take)

    this.buffered = this.buffered.subarray(take)

    return out as Uint8Array
  }

  async skip(size: number): Promise<void> {
    let remaining = size

    while (remaining > 0) remaining -= (await this.readUpTo(remaining)).byteLength
  }

  async cancel(): Promise<void> {
    await this.reader.cancel().catch(() => undefined)
    this.reader.releaseLock()
  }

  async readAny(): Promise<Uint8Array | null> {
    if (this.buffered.byteLength > 0) {
      const chunk = this.buffered

      this.buffered = new Uint8Array(0)

      return chunk as Uint8Array
    }
    const { done, value } = await this.reader.read()

    if (done) return null
    if (!value || value.byteLength === 0) return this.readAny()

    return value as Uint8Array
  }

  readRemainderStream(prefix?: Uint8Array): ReadableStream<Uint8Array> {
    const reader = this
    let sentPrefix = false

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (!sentPrefix) {
          sentPrefix = true
          if (prefix && prefix.byteLength > 0) {
            controller.enqueue(prefix)

            return
          }
        }
        try {
          const chunk = await reader.readAny()

          if (chunk) controller.enqueue(chunk)
          else controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
      cancel() {
        return reader.cancel()
      },
    })
  }
}

function startsWith(bytes: Uint8Array, prefix: Uint8Array): boolean {
  if (bytes.byteLength < prefix.byteLength) return false
  for (let i = 0; i < prefix.byteLength; i++) if (bytes[i] !== prefix[i]) return false

  return true
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
