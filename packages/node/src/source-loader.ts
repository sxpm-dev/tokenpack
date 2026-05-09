// Node-side source loader. Handles raw bytes (Buffer/Uint8Array), URLs
// (http/https/file), and bare paths via `fs.readFileSync`. Used by both
// `decode()` and `diff()` so the supported source-shape is identical.

import fs from 'fs'
import path from 'path'

import type { DecodeSource } from './decode'

export interface LoadedSource {
  bytes: Buffer
  ext: string
}

export async function loadSource(source: DecodeSource): Promise<LoadedSource> {
  if (Buffer.isBuffer(source)) return { bytes: source, ext: sniffExt(source) }
  if (source instanceof Uint8Array) {
    const buf = Buffer.from(source.buffer, source.byteOffset, source.byteLength)

    return { bytes: buf, ext: sniffExt(buf) }
  }
  if (
    source instanceof URL ||
    (typeof source === 'string' && /^(?:https?|file):\/\//.test(source))
  ) {
    const url = typeof source === 'string' ? new URL(source) : source

    if (url.protocol === 'file:') {
      const fileBytes = fs.readFileSync(url)

      return { bytes: fileBytes, ext: path.extname(url.pathname) || '.png' }
    }

    const response = await fetch(url.toString())

    if (!response.ok) throw new Error(`fetch ${url.toString()}: ${response.status}`)
    const ab = await response.arrayBuffer()

    return {
      bytes: Buffer.from(ab),
      ext: path.extname(url.pathname) || '.png',
    }
  }

  return {
    bytes: fs.readFileSync(source),
    ext: path.extname(source) || '.png',
  }
}

function sniffExt(buf: Buffer): string {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return '.png'
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46
  ) {
    if (buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return '.webp'
  }
  if (
    buf.length >= 12 &&
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  ) {
    return '.avif'
  }

  return '.png'
}
