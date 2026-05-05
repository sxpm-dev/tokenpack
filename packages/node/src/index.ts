// @tokenpack/node — Node.js adapters for TokenPack
//
// Re-exports the browser-safe core surface from `tokenpack`, plus Node-only
// helpers (file I/O encode/decode, archive directory walks, Node-stream
// decoders, sharp-backed AVIF/WebP surfaces).
//
// Side effect on import: registers AVIF and WebP surfaces with the core
// registry so consumers calling `surfaceRegistry.byFormat('avif')` or
// `byFormat('webp')` from Node get a sharp-backed implementation.

import { surfaceRegistry } from 'tokenpack/surfaces/registry'
import { AvifSurface } from './surfaces/avif'
import { WebpSurface } from './surfaces/webp'

// Override core's auto-registered AVIF/WebP factories with the @tokenpack/node
// versions so the same module specifier works whether you import @tokenpack/node
// or just plain `tokenpack`. Once core stops auto-registering them in Phase 2's
// final step, this becomes the single source of truth.
surfaceRegistry.register('avif', () => new AvifSurface())
surfaceRegistry.register('webp', () => new WebpSurface())

// Browser-safe re-exports
export * from 'tokenpack'

// Node-only re-exports — file I/O encode/decode
export { decode, decodeFile, decodeFromBuffer, decodeToBuffer } from 'tokenpack/decoder'
export { encode, encodeFile, encodeToBuffer } from 'tokenpack/encoder'
export { createTokenDecodeStream } from 'tokenpack/stream-decoder'

// Archive — directory walk + fs-based pack/unpack
export { packDirs, packDir, unpackDir } from 'tokenpack/archive'

// Diff (file-based)
export { diffTokens, diffText, type FileDiff } from 'tokenpack/diff'

// Surfaces (sharp-backed)
export { AvifSurface } from './surfaces/avif'
export { WebpSurface } from './surfaces/webp'
