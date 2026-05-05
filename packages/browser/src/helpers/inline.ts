// Inline data URI helper for embedding TokenPack payloads directly in HTML/CSS.
//
// Usage:
//   const dataUrl = await encodeInline('{"x":42}')
//   <img src={dataUrl} />
//   // or for CSS:  background-image: url(...);

import { encode, type EncodeBrowserOptions } from '../encode'

export async function encodeInline(
  content: string | Uint8Array | ArrayBuffer | Blob,
  options: EncodeBrowserOptions = {},
): Promise<string> {
  const result = await encode(content, options)

  return result.dataURL
}

/**
 * Decode an inline data URI produced by `encodeInline` (or any TokenPack PNG data URI).
 * Convenience wrapper around `decode(dataURL)`.
 */
export async function decodeInline(dataURL: string, options: { key?: string } = {}): Promise<Uint8Array> {
  const { decode } = await import('../decode')

  return decode(dataURL, options)
}
