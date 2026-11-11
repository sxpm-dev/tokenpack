// Shared tpAK chunk machinery for PixelRange* node variants. Pack data lives
// in a `tpAK` PNG ancillary chunk inserted right after IHDR. IDAT pixels are
// arbitrary decoration. Range-fetch friendly: chunk bytes are at known
// absolute file offsets so a consumer can `Range: bytes=A-B` to pull a
// region without decoding pixels.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)

  for (let n = 0; n < 256; n++) {
    let c = n

    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }

  return table
})()

function crc32(bytes: Buffer): number {
  let c = 0xffffffff

  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)

  return (c ^ 0xffffffff) >>> 0
}

/** Insert a tpAK chunk after IHDR using one output allocation. */
export function insertTpakChunk(imageBytes: Buffer, data: Uint8Array): Buffer {
  const ihdrEnd = 33

  if (
    imageBytes.length < ihdrEnd ||
    !imageBytes.subarray(0, 8).equals(PNG_SIGNATURE) ||
    imageBytes.readUInt32BE(8) !== 13 ||
    imageBytes.toString('ascii', 12, 16) !== 'IHDR'
  ) {
    throw new Error('not a PNG (missing IHDR)')
  }
  const chunkLength = data.byteLength + 12
  const output = Buffer.allocUnsafe(imageBytes.length + chunkLength)

  imageBytes.copy(output, 0, 0, ihdrEnd)
  output.writeUInt32BE(data.byteLength, ihdrEnd)
  output.write('tpAK', ihdrEnd + 4, 'ascii')
  output.set(data, ihdrEnd + 8)
  output.writeUInt32BE(
    crc32(output.subarray(ihdrEnd + 4, ihdrEnd + 8 + data.byteLength)),
    ihdrEnd + 8 + data.byteLength,
  )
  imageBytes.copy(output, ihdrEnd + chunkLength, ihdrEnd)

  return output
}

export function extractTpakChunk(pngBytes: Buffer): Buffer {
  if (pngBytes.length < 8 || !pngBytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('not a PNG (missing signature)')
  }
  let pos = 8

  while (pos + 8 <= pngBytes.length) {
    const length = pngBytes.readUInt32BE(pos)
    const type = pngBytes.subarray(pos + 4, pos + 8).toString('ascii')
    const dataStart = pos + 8
    const dataEnd = dataStart + length

    if (dataEnd + 4 > pngBytes.length) throw new Error('truncated PNG chunk')
    if (type === 'tpAK') return pngBytes.subarray(dataStart, dataEnd)
    if (type === 'IEND') break
    pos = dataEnd + 4 // advance past CRC
  }
  throw new Error('no tpAK chunk found in PNG')
}
