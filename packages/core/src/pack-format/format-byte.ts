// One-byte discriminator that follows the tokenpack signature in pack/diff
// tokens. File-format tokens (today's behavior) carry no discriminator; the
// decoder treats absence as 0x01.

export const FORMAT_FILE = 0x01
export const FORMAT_PACK = 0x02
export const FORMAT_DIFF = 0x03

export type FormatByte = typeof FORMAT_FILE | typeof FORMAT_PACK | typeof FORMAT_DIFF

const VALID = new Set<number>([FORMAT_FILE, FORMAT_PACK, FORMAT_DIFF])

export function writeFormatByte(buf: Uint8Array, offset: number, value: FormatByte): void {
  if (!VALID.has(value)) throw new Error(`unknown format byte: 0x${value.toString(16)}`)
  buf[offset] = value
}

export function readFormatByte(buf: Uint8Array, offset: number): FormatByte {
  const value = buf[offset]

  if (!VALID.has(value)) throw new Error(`unknown format byte: 0x${value.toString(16)}`)

  return value as FormatByte
}
