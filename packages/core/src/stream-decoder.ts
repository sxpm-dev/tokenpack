/**
 * Streaming TokenPack decoder for Node — thin Duplex adapter.
 *
 * Per the entity-composition principle (see
 * `docs/architecture/algorithm-as-entity-composition.md`), the streaming
 * pipeline is:
 *
 *   surface.decodeStream  → AsyncIterable<pixelRow>      (Surface owns container parser)
 *   → codec.decodeChunk   → data byte chunks             (Codec owns per-row decode)
 *   → compressor.decompressWebStream → final bytes       (Compressor owns inflate)
 *
 * This file is the Node-shaped entry point: it accepts a Node Duplex of PNG
 * bytes and emits decoded bytes. Internally it bridges Node Streams ↔ Web
 * Streams and delegates to `algorithm.decodeStream`. There is **no** PNG
 * parsing here — that lives in `StreamingPngSurface.decodeStream` (see
 * `tokenpack/surfaces/streaming-png-decoder` for the shared implementation).
 *
 * History: this used to inline a 330-line custom PNG parser duplicated from
 * the browser's `decode-stream.ts`. Both have been moved onto the surface.
 */

import { Duplex, Readable } from 'stream'

import { algorithmCatalog } from './algorithms/catalog'

const PEEK_BYTES = 64

/**
 * Returns a Duplex stream: pipe PNG token bytes in, read original bytes out.
 * Compatible with the previous inlined-pipeline shape; see file header for
 * the architectural change.
 */
export function createTokenDecodeStream(_key?: string): Duplex {
  // Buffered Duplex implementation. We collect the full input on the
  // writable side, run through `algorithm.decodeStream` (which IS streaming
  // internally — surface yields pixel rows progressively), and emit the
  // result on the readable side.
  //
  // Why buffer the input? Algorithm detection requires reading the codec
  // header from the first ~few pixels, which means we need the PNG signature
  // + IHDR + a chunk of IDAT before we can pick the algorithm. Today the
  // catalog's `detectFromBuffer` is a buffered API; once it grows a stream-
  // aware variant this Duplex can switch to true incremental mode.
  const inChunks: Buffer[] = []
  let inTotal = 0

  const out = new Duplex({
    write(chunk: Buffer, _enc, cb) {
      inChunks.push(chunk)
      inTotal += chunk.length
      cb()
    },
    read() {
      // Push happens via the async pipeline below; satisfy the Duplex contract.
    },
  })

  out.once('finish', () => {
    void runDecode()
  })

  async function runDecode() {
    try {
      const buffer = Buffer.concat(inChunks, inTotal)

      if (buffer.length < PEEK_BYTES) {
        out.destroy(new Error('createTokenDecodeStream: input too short to decode'))

        return
      }

      const Ctor = await algorithmCatalog.detectFromBuffer(buffer, '.png')
      const algorithm = new Ctor({})

      // Web ReadableStream from the buffered bytes. Node 18+ has Web Streams
      // globally; `Readable.toWeb()` is available too but constructing
      // directly is simpler when we already have the full buffer.
      const webStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(buffer))
          controller.close()
        },
      })

      const decodedStream = algorithm.decodeStream(webStream, {})
      // `Readable.fromWeb()` is available in Node 18+; pipe its output through
      // our Duplex's readable side.
      const nodeReadable = Readable.fromWeb(decodedStream as never)

      nodeReadable.on('data', (chunk: Buffer) => out.push(chunk))
      nodeReadable.on('end', () => out.push(null))
      nodeReadable.on('error', (e: Error) => out.destroy(e))
    } catch (e) {
      out.destroy(e instanceof Error ? e : new Error(String(e)))
    }
  }

  return out
}
