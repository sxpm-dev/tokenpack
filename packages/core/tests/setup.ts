// Test environment setup.
//
// Vitest's 'node' environment doesn't expose `globalThis.crypto` even though
// it's available in plain Node ≥ 18. Polyfill from node:crypto.webcrypto so
// the Web Crypto API used by src/crypto.ts works in tests.

import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) {
  // Cast: webcrypto satisfies the Crypto type but Node types declare it as `Crypto` differently across versions.
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  })
}
