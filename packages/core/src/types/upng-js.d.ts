declare module 'upng-js' {
  export interface UpngImage {
    width: number
    height: number
    depth: number
    ctype: number
    frames?: unknown[]
    tabs?: unknown
  }

  export function encode(
    imgs: ArrayBuffer[],
    width: number,
    height: number,
    colors?: number,
    dither?: number,
    forbidPlte?: boolean,
  ): ArrayBuffer

  export function decode(buf: ArrayBuffer | Uint8Array): UpngImage
  export function toRGBA8(img: UpngImage): ArrayBuffer[]

  const UPNG: {
    encode: typeof encode
    decode: typeof decode
    toRGBA8: typeof toRGBA8
  }

  export default UPNG
}
