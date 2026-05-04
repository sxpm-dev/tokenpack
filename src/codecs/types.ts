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

// Codecs that implement StreamingCodec can decode pixels incrementally as they
// arrive from the network, without buffering the entire image first.
export interface StreamCodecState { [key: string]: unknown }

export interface StreamingCodec extends Codec {
  createDecodeState(): StreamCodecState
  // Called once per arriving pixel chunk (e.g. one PNG scanline's worth of bpp bytes).
  // Returns any decoded bytes produced from this chunk, plus updated state.
  decodeChunk(pixelChunk: PixelBuffer, state: StreamCodecState): { bytes: Buffer; state: StreamCodecState }
}

export function isStreamingCodec(c: Codec): c is StreamingCodec {
  return 'decodeChunk' in c && typeof (c as StreamingCodec).decodeChunk === 'function'
}
