import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  })
}

// Importing the package's own entry-point registers Node-zlib compressors
// and pngjs/sharp surfaces with core's append-only registries.
import '../src'
