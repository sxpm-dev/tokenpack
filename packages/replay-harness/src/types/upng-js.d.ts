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

  const upng: {
    encode: typeof encode
    decode: typeof decode
    toRGBA8: typeof toRGBA8
  }

  export default upng
}
