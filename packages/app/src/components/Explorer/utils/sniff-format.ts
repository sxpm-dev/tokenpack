export type ImageFormat = 'png' | 'webp' | 'avif'

/** Detect image container format from the first bytes. */
export function sniffFormat(bytes: Uint8Array): ImageFormat | null {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'png'
  }

  // WebP: 'RIFF' XXXX 'WEBP'
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp'
  }

  // AVIF (HEIF/ISOBMFF): 'ftyp' at offset 4 + 'avif' brand
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 &&
    bytes[8] === 0x61 &&
    bytes[9] === 0x76 &&
    bytes[10] === 0x69 &&
    bytes[11] === 0x66
  ) {
    return 'avif'
  }

  return null
}

export function extensionForBytes(bytes: Uint8Array): string {
  const fmt = sniffFormat(bytes)

  return fmt ? `.${fmt}` : '.png'
}

export function mimeForBytes(bytes: Uint8Array): string {
  const fmt = sniffFormat(bytes)

  return fmt ? `image/${fmt}` : 'image/png'
}
