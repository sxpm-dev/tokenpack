// Ambient declarations for `upng-js` (no types ship with the package).
// Sibling to `png-upng.ts`; covers the minimal API used there.

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
