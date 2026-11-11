// Browser-side tpAK chunk machinery. Mirrors the node implementation
// (packages/node/src/algorithms/pixel-range-png-base.ts) but uses the
// browser's `Buffer`-via-buffer-shim so we don't pull node:buffer into the
// browser bundle.

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

/** Build a standard PNG chunk, including its CRC, without pixel conversion. */
export function createPngChunk(type: string, data: Uint8Array): Buffer {
  const chunk = Buffer.allocUnsafe(data.byteLength + 12)

  chunk.writeUInt32BE(data.byteLength, 0)
  chunk.write(type, 4, 4, 'ascii')
  chunk.set(data, 8)
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.byteLength)), 8 + data.byteLength)

  return chunk
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

export function extractTpakChunk(artifactBytes: Buffer): Uint8Array {
  if (artifactBytes.length < 8 || !artifactBytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('not a PNG')
  }
  let pos = 8

  while (pos + 8 <= artifactBytes.length) {
    const length = artifactBytes.readUInt32BE(pos)
    const type = artifactBytes.subarray(pos + 4, pos + 8).toString('ascii')

    if (pos + 12 + length > artifactBytes.length) throw new Error('truncated PNG chunk')
    if (type === 'tpAK') {
      const data = artifactBytes.subarray(pos + 8, pos + 8 + length)

      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    }
    if (type === 'IEND') break
    pos = pos + 8 + length + 4
  }
  throw new Error('no tpAK chunk found in PNG')
}
