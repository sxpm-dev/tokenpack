// Buffer polyfill for browser.
//
// Many of TokenPack's internal codecs / drawers / FEC modules use Node's
// `Buffer` API (Buffer.from, .concat, .readUInt32BE, etc.). In browsers,
// `Buffer` isn't defined, so without a polyfill those paths crash.
//
// We import the well-tested `buffer` package (~25KB gzipped) and install it
// on `globalThis.Buffer` so the rest of `@tokenpack/core` works unchanged.
//
// This is a side-effect import — `@tokenpack/browser/index.ts` imports this
// file first to ensure the global is set before any codec runs.

import { Buffer as BufferPolyfill } from 'buffer'

const g = globalThis as { Buffer?: typeof BufferPolyfill }

if (typeof g.Buffer === 'undefined') {
  g.Buffer = BufferPolyfill
}

export {}
