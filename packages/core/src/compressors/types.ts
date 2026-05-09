import type { OptionsSchema } from '../components/options'

// `Transform` from Node's `stream` module — typed lazily so the browser
// build (which doesn't have @types/node) doesn't choke on this import.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NodeTransform = any

export type CompressionMode =
  | 'none'
  | 'deflate-1'
  | 'deflate-6'
  | 'deflate-9'
  | 'brotli-4'
  | 'brotli-6'
  | 'brotli-11'

export interface CompressionResult {
  data: Buffer
  level: number
  uncompressedLength: number
}

export interface CompressionMeta {
  level: number
  uncompressedLength: number
}

// Compress/decompress are async because browser implementations use
// CompressionStream / DecompressionStream — both are inherently async APIs.
// Node implementations wrap their sync zlib calls in Promise.resolve.
export abstract class AbstractCompressor {
  /** Tunable options for this compressor (level etc.). Subclasses override. */
  static readonly optionsSchema: OptionsSchema = {}
  /** Compressor family id (e.g. 'brotli', 'deflate', 'none'). Subclasses override. */
  static readonly familyId: string = 'none'
  /** Short human-readable explanation for UI tooltips. Subclasses override. */
  static readonly description: string = ''

  abstract readonly id: CompressionMode
  abstract readonly label: string
  abstract readonly headerLevel: number
  abstract readonly streamableDecode: boolean
  abstract readonly requiresFullHeader: boolean

  abstract compress(input: Buffer): Promise<CompressionResult>
  abstract decompress(input: Buffer, meta?: CompressionMeta): Promise<Buffer>

  // Optional Node Transform stream — only Node-side compressors implement it.
  createDecodeStream?(): NodeTransform

  /**
   * Web Streams streaming-decompress entry point. Browser compressors
   * override with `pipeThrough(new DecompressionStream(...))`; Node-side
   * compressors can adapt their `Transform` via `Duplex.toWeb()`.
   *
   * Default implementation buffers the entire input then runs `decompress` —
   * keeps the contract uniform for compressors without a true streaming
   * decoder. The Algorithm.decodeStream orchestrator pipes
   * codec-data-bytes through this; full streaming requires an override.
   */
  decompressWebStream(input: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
    const decompress = this.decompress.bind(this)

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = input.getReader()
        const chunks: Uint8Array[] = []
        let total = 0

        while (true) {
          const { done, value } = await reader.read()

          if (done) break
          chunks.push(value)
          total += value.byteLength
        }
        const merged = new Uint8Array(total)
        let offset = 0

        for (const c of chunks) {
          merged.set(c, offset)
          offset += c.byteLength
        }
        const decompressed = await decompress(
          Buffer.from(merged.buffer, merged.byteOffset, merged.byteLength),
        )

        controller.enqueue(
          new Uint8Array(decompressed.buffer, decompressed.byteOffset, decompressed.byteLength),
        )
        controller.close()
      },
    })
  }
}
