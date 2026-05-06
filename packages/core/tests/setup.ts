// Test environment setup.
//
// 1. Polyfill `globalThis.crypto` from `node:crypto.webcrypto` (Vitest's 'node'
//    env doesn't expose it, even though it's available on plain Node ≥ 18).
// 2. Register Node-zlib compressors and pngjs/sharp surfaces with core's
//    append-only registries by importing `@tokenpack/node`. Core ships only
//    `none` + zero surfaces by design — env packages contribute the rest.

import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) {
  // Cast: webcrypto satisfies the Crypto type but Node types declare it as `Crypto` differently across versions.
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  })
}

import '@tokenpack/node'
