// Pure (browser-safe) decode finalization: combine chunks → optional FEC →
// optional decryption → decompress → original payload bytes.
//
// Extracted from decoder.ts so callers that don't need fs (browser, in-memory
// flows) can use it without pulling Node `fs`/`os`/`path`.

import { compressorRegistry } from './compressors/registry'
import { decryptData } from './crypto'
import type { ChunkReadResult } from './drawers/types'
import { fecRegistry } from './fec/registry'

export async function finalizeChunks(
  chunks: ChunkReadResult[],
  key?: string,
): Promise<Buffer> {
  chunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
  if (chunks.length > 1) {
    const sid = chunks[0].streamId

    for (const c of chunks) {
      if (c.streamId !== sid)
        throw new Error('Stream ID mismatch — chunks are from different tokens')
    }
  }

  const { compressionLevel, encrypted, fecLevel, preFecLength } = chunks[0]
  let combined: Buffer = Buffer.concat(chunks.map(c => c.bytes))

  // FEC runs first (outermost layer on encode → first to undo on decode).
  if (fecLevel > 0) {
    const fec = fecRegistry.byHeaderLevel(fecLevel)

    combined = fec.decode(combined, preFecLength)
  }

  if (encrypted) {
    if (!key) throw new Error('Token is encrypted — provide --key to decode')
    combined = Buffer.from(await decryptData(combined, key))
  }

  return await compressorRegistry.byHeaderLevel(compressionLevel).decompress(combined)
}
