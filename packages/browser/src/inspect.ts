// Browser inspect — best-effort metadata about how a token was encoded.
//
// Detects the algorithm Ctor from raw bytes and (for pixel-header-bearing
// artifacts) reads the in-pixel header to recover encode-time options
// (compression level, channels, FEC, cell size, encryption flag). PixelRange
// algorithms don't carry a pixel header, so only the algorithm binding is
// returned for those.

import { browserAlgorithmCatalog as algorithmCatalog } from './algorithms/catalog'
import type { AlgorithmCtor } from 'tokenpack/algorithms/types'
import { decodeEcByte, isCompactToken, readCompactHeader, readHeader } from 'tokenpack/header'

import type { DecodeSource } from './decode'

export interface InspectAlgorithm {
  name: string
  title: string
  description?: string
  codec: string
  codecDescription?: string
  surface: string
  surfaceDescription?: string
  compressor: string
  compressorDescription?: string
  drawer: string
  drawerDescription?: string
  environments: ('node' | 'browser')[]
  streamable: boolean
}

export interface InspectHeader {
  /** Header version byte (full headers only). */
  version?: number
  /** 0 = none, 1 = deflate, 2 = brotli (legacy magnitude byte from pixel header). */
  compressionLevel: number
  channels: 1 | 2 | 3 | 4
  fecLevel: number
  /** 1 = dense, ≥3 = dot mode (cell side in pixels). */
  cellSize: number
  encrypted: boolean
  uncompressedLength?: number
  width?: number
  height?: number
}

export interface InspectInfo {
  algorithm: InspectAlgorithm
  /** Pixel-header info — present only for codecs that embed bytes in pixels. */
  header?: InspectHeader
}

interface CodecLike {
  name: string
  metadata?: { description?: string }
}

interface SurfaceLike {
  id: string
  description?: string
}

interface DrawerLike {
  id: string
  description?: string
}

export async function inspect(source: DecodeSource): Promise<InspectInfo> {
  const buffer = await sourceToBytes(source)
  const Ctor = await algorithmCatalog.detectFromBuffer(buffer, '.png')
  const algorithm = describeBinding(Ctor)
  const header = await tryReadHeader(buffer, Ctor)

  return header ? { algorithm, header } : { algorithm }
}

async function sourceToBytes(source: DecodeSource): Promise<Buffer> {
  if (source instanceof Uint8Array) {
    return Buffer.from(source.buffer, source.byteOffset, source.byteLength)
  }
  if (source instanceof ArrayBuffer) return Buffer.from(source)
  if (source instanceof Blob) return Buffer.from(await source.arrayBuffer())
  if (typeof source === 'string') {
    const r = await fetch(source)

    if (!r.ok) throw new Error(`fetch ${source}: ${r.status}`)

    return Buffer.from(await r.arrayBuffer())
  }
  throw new TypeError('inspect(): unsupported source type')
}

function describeBinding(Ctor: AlgorithmCtor): InspectAlgorithm {
  const codec = new (Ctor.Codec as unknown as new () => CodecLike)()
  const surface = new (Ctor.Surface as unknown as new () => SurfaceLike)()
  const drawer = new (Ctor.Drawer as unknown as new () => DrawerLike)()
  const ctorMeta = Ctor as unknown as {
    name: string
    title?: string
    description?: string
  }
  const compressorCtor = Ctor.Compressor as unknown as {
    familyId: string
    description?: string
  }

  return {
    name: ctorMeta.name,
    title: ctorMeta.title ?? ctorMeta.name,
    description: ctorMeta.description,
    codec: codec.name,
    codecDescription: codec.metadata?.description,
    surface: surface.id,
    surfaceDescription: surface.description,
    compressor: compressorCtor.familyId,
    compressorDescription: compressorCtor.description,
    drawer: drawer.id,
    drawerDescription: drawer.description,
    environments: [...Ctor.capabilities.environments],
    streamable: Ctor.capabilities.streamable,
  }
}

async function tryReadHeader(buffer: Buffer, Ctor: AlgorithmCtor): Promise<InspectHeader | undefined> {
  try {
    const surface = new Ctor().surface
    const image = await surface.readBuffer(buffer)

    if (isCompactToken(image.pixels)) {
      const h = readCompactHeader(image.pixels)
      // Compact header has no FEC/cellSize/encryption byte — flags byte (h.flags)
      // encodes only the bpp bits and 2 reserved low bits.
      return {
        compressionLevel: 0,
        channels: h.channels,
        fecLevel: 0,
        cellSize: 1,
        encrypted: false,
        width: image.width,
        height: image.height,
      }
    }

    const h = readHeader(image.pixels)
    const ec = decodeEcByte(h.ecLevel)

    return {
      version: h.version,
      compressionLevel: h.compressionLevel,
      channels: h.channels,
      fecLevel: ec.fecLevel,
      cellSize: h.cellSize,
      encrypted: ec.encrypted,
      uncompressedLength: h.uncompressedLength,
      width: h.width,
      height: h.height,
    }
  } catch {
    return undefined
  }
}
