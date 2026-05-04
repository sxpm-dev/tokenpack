export type PixelBuffer = Uint8Array // flat RGBA, 4 bytes per pixel (new) or RGB 3 bytes (old)

export interface Codec {
  id: number
  name: string
  // channels: always 3 (RGB) format (backward compat)
  encode(input: Buffer, dataPixelCount: number, width: number, height: number, channels?: number): PixelBuffer
  decode(pixels: PixelBuffer, length: number, width: number, height: number, channels?: number): Buffer
  // Default (when absent): Math.ceil(input.length / channels)
  estimateDataPixels?(input: Buffer, channels?: number): number
}
