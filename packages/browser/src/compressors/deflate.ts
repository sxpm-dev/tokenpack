// Browser deflate compressor — uses the native CompressionStream /
// DecompressionStream APIs (available in all evergreen browsers + Node ≥ 17).
//
// `CompressionStream('deflate')` writes RFC-1950 zlib-wrapped deflate, matching
// `zlib.deflateSync` output, so tokens encoded by the Node-side DeflateCompressor
// decode here unchanged.

import {
  AbstractCompressor,
  type CompressionMode,
  type CompressionResult,
} from 'tokenpack/compressors/types'

type DeflateMode = Extract<CompressionMode, 'deflate-1' | 'deflate-6' | 'deflate-9'>

const HEADER_LEVEL: Record<DeflateMode, number> = {
  'deflate-1': 3,
  'deflate-6': 1,
  'deflate-9': 4,
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

export class BrowserDeflateCompressor extends AbstractCompressor {
  readonly id: DeflateMode
  readonly label: string
  readonly streamableDecode = true
  readonly headerLevel: number
  readonly requiresFullHeader = true

  constructor(mode: DeflateMode) {
    super()
    this.id = mode
    this.label = `Deflate ${mode.split('-')[1]} (browser)`
    this.headerLevel = HEADER_LEVEL[mode]
    // CompressionStream doesn't expose level tuning — browsers pick their own
    // default. For decode parity it doesn't matter; for encode it means tokens
    // produced in-browser may be slightly larger than Node-encoded ones at the
    // same nominal level.
  }

  async compress(input: Buffer): Promise<CompressionResult> {
    const stream = makeStream(new Uint8Array(input.buffer, input.byteOffset, input.byteLength))

    const compressed = await streamThrough(
      stream.pipeThrough(new CompressionStream('deflate') as any),
    )

    return {
      data: Buffer.from(compressed),
      level: this.headerLevel,
      uncompressedLength: input.length,
    }
  }

  async decompress(input: Buffer): Promise<Buffer> {
    const stream = makeStream(new Uint8Array(input.buffer, input.byteOffset, input.byteLength))

    const decompressed = await streamThrough(
      stream.pipeThrough(new DecompressionStream('deflate') as any),
    )

    return Buffer.from(decompressed)
  }
}
