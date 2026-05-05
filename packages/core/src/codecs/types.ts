export type PixelBuffer = Uint8Array

export type Friendliness = 'yes' | 'partial' | 'no'

export interface CodecMetadata {
  pixelLayout: string
  writeStyle: string
  dependencies: string
  beFriendly: Friendliness
  feFriendly: Friendliness
  streamFriendly: Friendliness
  approxRatio: string
  description: string
  family: 'legacy' | 'A' | 'B' | 'C'
  familyLabel: string
  requiredChannels?: 1 | 2 | 3 | 4
}

export interface Codec {
  id: number
  name: string
  metadata?: CodecMetadata
  encode(
    input: Buffer,
    dataPixelCount: number,
    width: number,
    height: number,
    channels?: number,
  ): PixelBuffer
  decode(
    pixels: PixelBuffer,
    length: number,
    width: number,
    height: number,
    channels?: number,
  ): Buffer
  estimateDataPixels?(input: Buffer, channels?: number): number
}

export abstract class AbstractCodec implements Codec {
  abstract id: number
  abstract name: string
  abstract metadata: CodecMetadata
  abstract encode(
    input: Buffer,
    dataPixelCount: number,
    width: number,
    height: number,
    channels?: number,
  ): PixelBuffer
  abstract decode(
    pixels: PixelBuffer,
    length: number,
    width: number,
    height: number,
    channels?: number,
  ): Buffer

  estimateDataPixels?(input: Buffer, channels?: number): number
}

export interface StreamCodecState {
  [key: string]: unknown
}

export interface StreamingCodec extends Codec {
  createDecodeState(): StreamCodecState
  decodeChunk(
    pixelChunk: PixelBuffer,
    state: StreamCodecState,
  ): { bytes: Buffer; state: StreamCodecState }
}

export function isStreamingCodec(c: Codec): c is StreamingCodec {
  return 'decodeChunk' in c && typeof (c as StreamingCodec).decodeChunk === 'function'
}
