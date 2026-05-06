// Inline data URI helper for embedding TokenPack payloads directly in HTML/CSS.
//
// Usage:
//   const dataUrl = await encodeInline('{"x":42}')
//   <img src={dataUrl} />
//   // or for CSS:  background-image: url(...);

import type { DecodeResult } from 'tokenpack/decode-result'

import { encode, type EncodeBrowserOptions } from '../encode'

export async function encodeInline(
  content: string | Uint8Array | ArrayBuffer | Blob,
  options: EncodeBrowserOptions = {},
): Promise<string> {
  const result = await encode(content, options)

  return result.dataURL
}

/** Decode an inline data URI back to a unified `DecodeResult`. */
export async function decodeInline(
  dataURL: string,
  options: { key?: string } = {},
): Promise<DecodeResult> {
  const { decode } = await import('../decode')

  return decode(dataURL, options)
}
