'use client'

import { useEffect, useState } from 'react'

import { decode, type DecodeSource } from '../decode'

export interface TokenAsImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'onError'
> {
  /** A URL, Blob, ArrayBuffer, Uint8Array, HTMLImageElement, or ImageBitmap. */
  src: DecodeSource
  /** Decryption key (for encrypted tokens). */
  cipherKey?: string
  /** Optional content-type for the resulting blob URL (default: 'image/png'). */
  contentType?: string
  /** Decode error callback (different shape from `<img onError>`). */
  onDecodeError?: (error: Error) => void
}

/**
 * Decode a TokenPack image and render it as a regular `<img>`.
 *
 * The decoded payload bytes are wrapped in a Blob URL so the browser renders
 * them via the native pipeline. Use this when the *payload* of the token is
 * itself an image (e.g., a screenshot encoded as a TokenPack PNG).
 *
 * For non-image payloads (JSON, code, etc.) use `<TokenImage>` + `onDecoded`
 * instead — this component would render nonsense bytes as a broken image.
 */
export function TokenAsImage({
  src,
  cipherKey,
  contentType = 'image/png',
  onDecodeError,
  ...imgProps
}: TokenAsImageProps) {
  const [objectURL, setObjectURL] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let url: string | null = null

    decode(src, { key: cipherKey })
      .then(async result => {
        if (cancelled) return
        // TokenAsImage renders the payload as an image — only valid for FilePack.
        if (result.isPack() || result.isDiff()) {
          onDecodeError?.(new Error('TokenAsImage: token is a pack/diff, not a single file'))

          return
        }
        const bytes = await result.content()

        if (cancelled) return
        const blob = new Blob([bytes as unknown as ArrayBuffer], { type: contentType })

        url = URL.createObjectURL(blob)
        setObjectURL(url)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        onDecodeError?.(e instanceof Error ? e : new Error(String(e)))
      })

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [src, cipherKey, contentType, onDecodeError])

  if (!objectURL) return null

  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...imgProps} src={objectURL} />
}
