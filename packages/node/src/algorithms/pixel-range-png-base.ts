// Shared tpAK chunk machinery for PixelRange* node variants. Pack data lives
// in a `tpAK` PNG ancillary chunk inserted right after IHDR. IDAT pixels are
// arbitrary decoration. Range-fetch friendly: chunk bytes are at known
// absolute file offsets so a consumer can `Range: bytes=A-B` to pull a
// region without decoding pixels.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const TPAK_TYPE = Buffer.from('tpAK', 'ascii')

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

function buildChunk(type: Buffer, data: Buffer): Buffer {
  const length = Buffer.alloc(4)

  length.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([type, data])
  const crc = Buffer.alloc(4)

  crc.writeUInt32BE(crc32(crcInput), 0)

  return Buffer.concat([length, type, data, crc])
}

/**
 * Insert a `tpAK` ancillary chunk after IHDR (which is always first in PNG).
 * IHDR is 25 bytes total: 4 length + 4 type + 13 data + 4 crc. So inserting
 * at byte 8 + 25 = 33 places the chunk between IHDR and the first IDAT.
 */
export function insertTpakChunk(pngBytes: Buffer, data: Uint8Array): Buffer {
  const ihdrEnd = 8 + 25
  const dataBuf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
  const chunk = buildChunk(TPAK_TYPE, dataBuf)

  return Buffer.concat([pngBytes.subarray(0, ihdrEnd), chunk, pngBytes.subarray(ihdrEnd)])
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

    if (type === 'tpAK') return Buffer.from(pngBytes.subarray(dataStart, dataEnd))
    if (type === 'IEND') break
    pos = dataEnd + 4 // advance past CRC
  }
  throw new Error('no tpAK chunk found in PNG')
}
