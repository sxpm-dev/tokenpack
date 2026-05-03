export type PixelBuffer = Uint8Array  // flat RGB, 3 bytes per pixel

export interface Codec {
  id: number
  name: string
  // dataPixelCount = width * height - 32 (data region, excludes header)
  encode(input: Buffer, dataPixelCount: number, width: number, height: number): PixelBuffer
  decode(pixels: PixelBuffer, length: number, width: number, height: number): Buffer
}
