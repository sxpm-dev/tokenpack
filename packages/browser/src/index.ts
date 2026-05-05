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

export { encode, type EncodeBrowserOptions, type EncodeResult } from './encode'
export { decode, decodeJSON, decodeText, type DecodeOptions, type DecodeSource } from './decode'
export { TokenImage, type TokenImageProps } from './components/TokenImage'
export {
  useTokenPack,
  type TokenPackResult,
  type TokenPackState,
  type UseTokenPackOptions,
} from './hooks/useTokenPack'
export { encodeInline, decodeInline } from './helpers/inline'
export { sendPack, onPack, type SendPackOptions, type PackHandler } from './helpers/postMessage'
export { handleTokenpackRequest, type HandleTokenpackOptions } from './helpers/sw'
