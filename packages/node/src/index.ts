// @tokenpack/node — Node.js adapters for TokenPack.
//
// Three top-level functions: `encode`, `decode`, `extract`. Each handles
// every input shape (Buffer / Uint8Array / file path / directory path / URL)
// in a single function — no `encodeFile`/`encodeToBuffer`/`decodeFromBuffer`
// proliferation.
//
// Side effects on import:
//   1. Polyfill `globalThis.crypto` from `node:crypto.webcrypto` for Node < 19
//      (core's encoder/crypto use `globalThis.crypto.randomUUID` and
//      `crypto.subtle`; on Node 18.x these aren't on globalThis by default).
//   2. Register Node-zlib compressors (deflate-*, brotli-*) and sharp/pngjs
//      surfaces (PNG, streaming-PNG, AVIF, WebP) with core's append-only
//      registries. Core itself ships only `none` + zero surfaces so it stays
//      browser-bundleable; env packages contribute their own implementations.

import { webcrypto } from 'node:crypto'

if (!(globalThis as { crypto?: unknown }).crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  })
}

// Side-effect: registers Node-only compressors + surfaces with core registries.
import './register'

// Browser-safe re-exports from core
export * from 'tokenpack'

// Unified encode/decode + extract helper
export { decode, type DecodeOptions, type DecodeSource, extract } from './decode'
export { encode, type EncodeInput } from './encode'

// Diff producers (file-based heatmap + text)
export { diffText, diffTokens, type FileDiff } from 'tokenpack/diff'

// Streaming decoder (Node Duplex). Browser equivalent is `@tokenpack/browser`'s decode.
export { createTokenDecodeStream as decodeStream } from 'tokenpack/stream-decoder'

// Surfaces (sharp/pngjs-backed)
export { AvifSurface } from './surfaces/avif'
export { PngSurface } from './surfaces/png'
export { StreamingPngSurface } from './surfaces/streaming-png'
export { WebpSurface } from './surfaces/webp'

// Compressors (Node zlib-backed)
export { BrotliCompressor } from './compressors/brotli'
export { DeflateCompressor } from './compressors/deflate'

// Node-only codecs.
export { hasZstd, ZstdpixCodec, zstdpixCodec } from './codecs/zstdpix'

// Manual registration entry-point (e.g. for test setup that imports core directly).
export { registerNodeDefaults } from './register'
