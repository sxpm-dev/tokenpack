// Pure (browser-safe) decode finalization: combine chunks → optional FEC →
// optional decryption → decompress → original payload bytes.
//
// Multi-chunk encoding is not supported in the bound-recipe model — large
// payloads flow through PackBuilder regions. The decoder still accepts an
// array of `ChunkReadResult` so the call shape stays uniform; in practice
// `chunks.length === 1` and the loop is a no-op concat.

import { compressorRegistry } from './compressors/registry'
import { decryptData } from './crypto'
import type { ChunkReadResult } from './drawers/types'
import { fecRegistry } from './fec/registry'

export async function finalizeChunks(chunks: ChunkReadResult[], key?: string): Promise<Buffer> {
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
