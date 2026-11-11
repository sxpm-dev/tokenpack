// Streaming PNG decoder — env-agnostic, used by both `@tokenpack/node`'s and
// `@tokenpack/browser`'s `StreamingPngSurface.decodeStream` overrides.
//
// Why in `core` instead of each env package: the implementation only depends
// on Web Standards (`ReadableStream`, `DecompressionStream`) which Node ≥ 18
// and modern browsers all expose. Putting it here keeps the two surfaces
// from drifting (the previous browser-only version + Node-only zlib version
// in `core/stream-decoder.ts` had subtle differences).
//
// Pipeline:
//   1. Read PNG signature + IHDR (sets width / fileChannels)
//   2. Pipe IDAT chunks through `DecompressionStream('deflate')`
//   3. Reconstruct scanlines, undo PNG filter
//   4. Yield raw pixel rows (`width * fileChannels` bytes each)
//
// `Algorithm.decodeStream` consumes those rows; codec header reading, codec
// decode, and outer-compression decoding all live there.

import type { SurfaceStreamHandle } from './types'

export async function decodeStreamingPng(
  stream: ReadableStream<Uint8Array>,
): Promise<SurfaceStreamHandle> {
  const reader = stream.getReader()

  // ── PNG-container state ────────────────────────────────────────────
  let pngBuf: Uint8Array<ArrayBufferLike> = new Uint8Array(0)
  let pngState: 'sig' | 'chunk' | 'done' = 'sig'

  let width = 0
  let height = 0
  let fileChannels: 3 | 4 = 3
  let scanlineLen = 0
  let prevLine: Uint8Array<ArrayBufferLike> = new Uint8Array(0)

  // Inflate-output queue — kept as a deque to avoid O(n²) memcpy across
  // 60+ inflate emissions on streaming-encoded PNGs (small IDAT blocks).
  const scanlineQueue: Uint8Array<ArrayBufferLike>[] = []
  let scanlineQueueBytes = 0

  function takeScanline(): Uint8Array | null {
    if (scanlineLen === 0 || scanlineQueueBytes < scanlineLen) return null
    const out = new Uint8Array(scanlineLen)
    let written = 0

    while (written < scanlineLen) {
      const head = scanlineQueue[0]
      const need = scanlineLen - written

      if (head.byteLength <= need) {
        out.set(head, written)
        written += head.byteLength
        scanlineQueueBytes -= head.byteLength
        scanlineQueue.shift()
      } else {
        out.set(head.subarray(0, need), written)
        written += need
        scanlineQueueBytes -= need
        scanlineQueue[0] = head.subarray(need)
      }
    }

    return out
  }

  const readyRows: Uint8Array[] = []
  let pngDone = false

  let idatInflate: InflateHandle | null = null

  let ihdrResolve!: () => void
  const ihdrReady = new Promise<void>(r => {
    ihdrResolve = r
  })
  let ihdrSeen = false

  function onScanlineBytes(chunk: Uint8Array<ArrayBufferLike>) {
    scanlineQueue.push(chunk)
    scanlineQueueBytes += chunk.byteLength

    while (true) {
      const row = takeScanline()

      if (!row) break
      const filterByte = row[0]
      const line = unfilterInPlace(row, filterByte, prevLine, fileChannels)

      prevLine = line
      readyRows.push(line)
    }
  }

  async function parsePng() {
    while (true) {
      if (pngState === 'sig') {
        if (pngBuf.byteLength < 8) return
        pngBuf = pngBuf.subarray(8)
        pngState = 'chunk'
      }
      if (pngState === 'chunk') {
        if (pngBuf.byteLength < 8) return
        const len = readUint32BE(pngBuf, 0)

        if (pngBuf.byteLength < 12 + len) return
        const type = String.fromCharCode(pngBuf[4], pngBuf[5], pngBuf[6], pngBuf[7])
        const data = pngBuf.subarray(8, 8 + len)

        pngBuf = pngBuf.subarray(12 + len)

        if (type === 'IHDR') {
          width = readUint32BE(data, 0)
          height = readUint32BE(data, 4)
          fileChannels = data[9] === 6 ? 4 : 3
          scanlineLen = 1 + width * fileChannels
          prevLine = new Uint8Array(width * fileChannels)
          if (!ihdrSeen) {
            ihdrSeen = true
            ihdrResolve()
          }
        } else if (type === 'IDAT') {
          if (!idatInflate) idatInflate = makeInflate(onScanlineBytes)
          await writeChunk(idatInflate.writer, data)
        } else if (type === 'IEND') {
          pngState = 'done'
          if (idatInflate) {
            await idatInflate.writer.close()
            await idatInflate.pump
          }

          return
        }
      }
      if (pngState === 'done') return
    }
  }

  const pumpDone = (async () => {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break
      pngBuf = concat(pngBuf, value)
      await parsePng()
      if ((pngState as string) === 'done') break
    }
    const handle = idatInflate as InflateHandle | null

    if ((pngState as string) !== 'done' && handle) {
      try {
        await handle.writer.close()
      } catch {
        /* already closed */
      }
      await handle.pump.catch(() => undefined)
    }
    pngDone = true
  })()

  await Promise.race([ihdrReady, pumpDone])
  if (!ihdrSeen) throw new Error('decodeStreamingPng: input ended before PNG IHDR')

  const rows = (async function* () {
    while (true) {
      while (readyRows.length > 0) {
        yield readyRows.shift()!
      }
      if (pngDone) return
      await Promise.resolve()
      await new Promise(r => setTimeout(r, 0))
    }
  })()

  return { width, height, fileChannels, rows }
}

interface InflateHandle {
  writer: WritableStreamDefaultWriter
  pump: Promise<void>
}

function makeInflate(onChunk: (chunk: Uint8Array<ArrayBufferLike>) => void): InflateHandle {
  const ds = new (DecompressionStream as any)('deflate')
  const writer = ds.writable.getWriter() as WritableStreamDefaultWriter
  const reader = ds.readable.getReader() as ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>
  const pump = (async () => {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break
      onChunk(value)
    }
  })()

  return { writer, pump }
}

async function writeChunk(
  writer: WritableStreamDefaultWriter,
  chunk: Uint8Array<ArrayBufferLike>,
): Promise<void> {
  await writer.write(chunk as any)
}

function unfilterInPlace(
  row: Uint8Array<ArrayBufferLike>,
  filterType: number,
  prev: Uint8Array<ArrayBufferLike>,
  channels: number,
): Uint8Array<ArrayBufferLike> {
  const len = row.byteLength - 1

  if (filterType === 0) return row.subarray(1)
  for (let i = 0; i < len; i++) {
    const idx = 1 + i
    const a = i >= channels ? row[idx - channels] : 0
    const b = prev[i] ?? 0
    const c = i >= channels ? (prev[i - channels] ?? 0) : 0

    if (filterType === 1) row[idx] = (row[idx] + a) & 0xff
    else if (filterType === 2) row[idx] = (row[idx] + b) & 0xff
    else if (filterType === 3) row[idx] = (row[idx] + ((a + b) >>> 1)) & 0xff
    else if (filterType === 4) row[idx] = (row[idx] + paeth(a, b, c)) & 0xff
  }

  return row.subarray(1)
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)

  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

function readUint32BE(buf: Uint8Array<ArrayBufferLike>, offset: number): number {
  return (
    ((buf[offset] << 24) | (buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]) >>> 0
  )
}

function concat(
  a: Uint8Array<ArrayBufferLike>,
  b: Uint8Array<ArrayBufferLike>,
): Uint8Array<ArrayBufferLike> {
  if (a.byteLength === 0) return b
  if (b.byteLength === 0) return a
  const out = new Uint8Array(a.byteLength + b.byteLength)

  out.set(a, 0)
  out.set(b, a.byteLength)

  return out
}
