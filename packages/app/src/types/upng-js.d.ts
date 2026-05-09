// Ambient declaration for `upng-js` — picked up by the app's tsconfig
// during Next.js's typecheck pass. Mirrors the shims inside
// `@tokenpack/browser` and `@tokenpack/node`. Required because Next's
// isolated typecheck doesn't auto-load workspace `.d.ts` files even
// when the importing package is in `transpilePackages`.

declare module 'upng-js' {
  export interface UpngImage {
    width: number
    height: number
    depth: number
    ctype: number
    data: Uint8Array
  }

  export function encode(
    imgs: ArrayBuffer[],
    w: number,
    h: number,
    cnum: number,
    dels?: number[],
    forbidPlte?: boolean,
  ): ArrayBuffer

  export function decode(buf: ArrayBuffer | Uint8Array): UpngImage

  export function toRGBA8(img: UpngImage): ArrayBuffer[]

  const _default: {
    encode: typeof encode
    decode: typeof decode
    toRGBA8: typeof toRGBA8
  }

  export default _default
}
