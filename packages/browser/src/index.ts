// @tokenpack/browser — DX-first browser API
//
// Phase 3 implementation:
//   - encode/decode using browser-native PNG codec (Canvas / createImageBitmap)
//   - <TokenImage> React component
//   - useTokenPack hook
//
// Sub-paths planned (placeholders for Phase 5/6):
//   - @tokenpack/browser/sw          (Service Worker helper)
//   - @tokenpack/browser/postMessage (cross-extension/iframe transport)
//   - @tokenpack/browser/inline      (inline-data-URI helper)
//
// IMPORTANT: side-effect imports below install (1) a Buffer polyfill on
// globalThis so the codec / drawer / FEC code paths from @tokenpack/core work
// in browsers, and (2) browser-native compressor + surface registrations
// (CompressionStream/DecompressionStream + Canvas) into core's registries.
import './buffer-polyfill'
import './register'

export { decode, type DecodeOptions, type DecodeSource } from './decode'
export { decodeStream, type DecodeStreamSource } from './decode-stream'
export { encode, type EncodeBrowserOptions, type EncodeResult } from './encode'
export { registerBrowserDefaults } from './register'
// Unified decode result type — re-export from core for convenience.
export { TokenAsImage, type TokenAsImageProps } from './components/TokenAsImage'
export { TokenImage, type TokenImageProps } from './components/TokenImage'
export { decodeInline, encodeInline } from './helpers/inline'
export { onPack, type PackHandler, sendPack, type SendPackOptions } from './helpers/postMessage'
export { type HandleTokenpackOptions, handleTokenpackRequest } from './helpers/sw'
export {
  type TokenPackResult,
  type TokenPackState,
  useTokenPack,
  type UseTokenPackOptions,
} from './hooks/useTokenPack'
export type { DecodeDirEntry, DecodeResult } from 'tokenpack/decode-result'
