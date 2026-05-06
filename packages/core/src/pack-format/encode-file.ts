// File-format encoding with optional name.
//
// When a name is provided to `encode(content, { name: 'x' })`, we wrap the
// payload in a `[sig][0x01][nameLen u16 LE][name][payload]` envelope so the
// decoder can recover the name. Anonymous file-format encodes still produce
// raw payload bytes (no envelope), keeping zero overhead and backward compat
// with pre-spec tokens.

import { FORMAT_FILE, writeFormatByte } from './format-byte'

const SIG = Uint8Array.of(0xc0, 0xde, 0xae, 0x54)
const enc = new TextEncoder()

export function wrapFileWithName(name: string, payload: Uint8Array): Uint8Array {
  const nameBytes = enc.encode(name)

  if (nameBytes.length > 0xffff) {
    throw new Error(`encode name too long: ${nameBytes.length} bytes (max 65535)`)
  }

  const out = new Uint8Array(4 + 1 + 2 + nameBytes.length + payload.length)
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength)

  out.set(SIG, 0)
  writeFormatByte(out, 4, FORMAT_FILE)
  view.setUint16(5, nameBytes.length, true)
  out.set(nameBytes, 7)
  out.set(payload, 7 + nameBytes.length)

  return out
}

/**
 * Read a wrapped file-format envelope. Caller must verify signature + format
 * byte are 0x01 before invoking.
 */
export function readWrappedFile(bytes: Uint8Array): { name: string; payload: Uint8Array } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const nameLen = view.getUint16(5, true)
  const name = new TextDecoder().decode(bytes.subarray(7, 7 + nameLen))
  const payload = bytes.subarray(7 + nameLen)

  return { name, payload }
}
