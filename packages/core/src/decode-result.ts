// Unified decode result.
//
// `decode()` returns either a single-file token or a packed-dir token, with the
// shape disambiguated by the `type` discriminator. This keeps the public API
// surface small (one entry per env) while letting callers branch cleanly:
//
//   const r = await decode(source)
//   if (r.type === 'file') return new TextDecoder().decode(r.payload)
//   for (const e of r.entries) ...

export type DecodeResult =
  | { type: 'file'; payload: Uint8Array }
  | { type: 'dir'; entries: DecodeDirEntry[] }

export interface DecodeDirEntry {
  /** Relative path inside the pack (forward slashes; can contain `/` for nested). */
  path: string
  /** Raw file bytes. */
  payload: Uint8Array
}

import { isCartArchive, unpackBuffers } from './archive-buffers'

/**
 * Wrap raw decoded bytes into a DecodeResult, detecting whether the payload
 * is a CART-format packed directory or a single-file token.
 */
export function toDecodeResult(payload: Uint8Array): DecodeResult {
  if (isCartArchive(payload)) {
    const unpacked = unpackBuffers(payload)

    return {
      type: 'dir',
      entries: unpacked.map(e => ({ path: e.path, payload: e.bytes })),
    }
  }

  return { type: 'file', payload }
}
