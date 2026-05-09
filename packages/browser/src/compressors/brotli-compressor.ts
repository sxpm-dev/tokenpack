// Browser brotli compressor — DECODE ONLY.
//
// Browsers ship `DecompressionStream('br')` (Chrome 118+, Edge 118+, Firefox 113+,
// Safari 17.4+) but no `CompressionStream('br')`. So we register a compressor
// that decodes brotli tokens but throws on compress. That's enough to decode
// any Node-encoded TokenPack at runtime.

import { enumOption, type OptionsSchema } from 'tokenpack/components/options'
import {
  AbstractCompressor,
  type CompressionMode,
  type CompressionResult,
} from 'tokenpack/compressors/types'

type BrotliMode = Extract<CompressionMode, 'brotli-4' | 'brotli-6' | 'brotli-11'>

const HEADER_LEVEL: Record<BrotliMode, number> = {
  'brotli-4': 5,
  'brotli-6': 6,
  'brotli-11': 2,
}

async function streamThrough(transform: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = transform.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()

    if (done) break
    chunks.push(value)
    total += value.byteLength
  }

  const out = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }

  return out
}

function makeStream(input: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<any>({
    start(controller) {
      controller.enqueue(input)
      controller.close()
    },
  })
}

export class BrowserBrotliCompressor extends AbstractCompressor {
  static override readonly familyId = 'brotli'
  static override readonly description =
    'Brotli — strongest ratio (~15% smaller than deflate-9), slow encode at quality 11. Server-only on the browser side (no native CompressionStream).'
  static override readonly optionsSchema: OptionsSchema = {
    level: enumOption([4, 6, 11], 11, { label: 'Quality level' }),
  }

  static fromOptions(opts: { level?: number } = {}): BrowserBrotliCompressor {
    const level = opts.level ?? 11
    return new BrowserBrotliCompressor(`brotli-${level}` as BrotliMode)
  }

  readonly id: BrotliMode
  readonly label: string
  readonly streamableDecode = true
  readonly headerLevel: number
  readonly requiresFullHeader: boolean

  constructor(mode: BrotliMode) {
    super()
    this.id = mode
    this.label = `Brotli ${mode.split('-')[1]} (browser, decode-only)`
    this.headerLevel = HEADER_LEVEL[mode]
    this.requiresFullHeader = mode !== 'brotli-11'
  }

  async compress(_input: Buffer): Promise<CompressionResult> {
    throw new Error(
      `Brotli encoding is unavailable in the browser (CompressionStream('br') is not implemented). ` +
        `Encode in Node and decode in the browser, or pick a deflate-* mode for browser-side encoding.`,
    )
  }

  async decompress(input: Buffer): Promise<Buffer> {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error(
        `DecompressionStream is unavailable in this browser. Brotli decoding requires a recent ` +
          `Chrome/Edge (118+), Firefox (113+) or Safari (17.4+).`,
      )
    }

    const stream = makeStream(new Uint8Array(input.buffer, input.byteOffset, input.byteLength))
    // TS lib.dom only types CompressionFormat as 'gzip' | 'deflate' | 'deflate-raw'
    // and DecompressionStream is BufferSource-typed (Uint8Array<ArrayBuffer> mismatch).
    // 'br' is supported at runtime in Chrome ≥ 118, Firefox ≥ 113, Safari ≥ 17.4.

    const Decompress = DecompressionStream as any

    const decompressed = await streamThrough(stream.pipeThrough(new Decompress('br') as any))

    return Buffer.from(decompressed)
  }

  override decompressWebStream(input: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error(
        `DecompressionStream is unavailable. Brotli streaming requires Chrome 118+ / Firefox 113+ / Safari 17.4+.`,
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Decompress = DecompressionStream as any

    return input.pipeThrough(new Decompress('br') as any) as ReadableStream<Uint8Array>
  }
}
