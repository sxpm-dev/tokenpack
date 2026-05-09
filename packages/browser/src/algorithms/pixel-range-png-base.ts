// Browser-side tpAK chunk machinery. Mirrors the node implementation
// (packages/node/src/algorithms/pixel-range-png-base.ts) but uses the
// browser's `Buffer`-via-buffer-shim so we don't pull node:buffer into the
// browser bundle.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const TPAK_TYPE = 'tpAK'

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

export function insertTpakChunk(imageBytes: Buffer, packBytes: Uint8Array): Buffer {
  const ihdrEnd = 8 + 25
  const dataBuf = Buffer.from(packBytes.buffer, packBytes.byteOffset, packBytes.byteLength)
  const length = Buffer.alloc(4)

  length.writeUInt32BE(dataBuf.length, 0)
  const type = Buffer.from(TPAK_TYPE, 'ascii')
  const crc = Buffer.alloc(4)

  crc.writeUInt32BE(crc32(Buffer.concat([type, dataBuf])), 0)
  const chunk = Buffer.concat([length, type, dataBuf, crc])

  return Buffer.concat([imageBytes.subarray(0, ihdrEnd), chunk, imageBytes.subarray(ihdrEnd)])
}

export function extractTpakChunk(artifactBytes: Buffer): Uint8Array {
  if (artifactBytes.length < 8 || !artifactBytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('not a PNG')
  }
  let pos = 8

  while (pos + 8 <= artifactBytes.length) {
    const length = artifactBytes.readUInt32BE(pos)
    const type = artifactBytes.subarray(pos + 4, pos + 8).toString('ascii')

    if (type === 'tpAK') {
      const data = artifactBytes.subarray(pos + 8, pos + 8 + length)

      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    }
    if (type === 'IEND') break
    pos = pos + 8 + length + 4
  }
  throw new Error('no tpAK chunk found in PNG')
}
