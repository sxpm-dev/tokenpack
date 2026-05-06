'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { DecodeResult } from 'tokenpack/decode-result'

import { decode, type DecodeSource } from '../decode'

export interface TokenImageProps {
  /** A URL, Blob, ArrayBuffer, Uint8Array, HTMLImageElement, or ImageBitmap. */
  src: DecodeSource
  /** Optional decryption key (for encrypted tokens). */
  cipherKey?: string
  /** Called once decode succeeds; receives the unified DecodeResult. */
  onDecoded?: (result: DecodeResult) => void
  /** Called when decode fails. */
  onError?: (error: Error) => void
  /** Rendered while decode is in flight. */
  fallback?: ReactNode
  /** Rendered after decode succeeds. Defaults to `null` — most callers consume the result via onDecoded. */
  children?: ReactNode
}

/**
 * Drop-in component that decodes a TokenPack image and yields the bytes via
 * `onDecoded`. Renders `fallback` while loading and `children` once decoded.
 *
 * Note: this does NOT render the image itself. Use a regular `<img>` for that.
 * `<TokenImage>` is for *consuming* the encoded payload.
 */
export function TokenImage({
  src,
  cipherKey,
  onDecoded,
  onError,
  fallback,
  children,
}: TokenImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')
  // Stable callback refs so prop changes mid-decode don't cause spurious cancels.
  const onDecodedRef = useRef(onDecoded)
  const onErrorRef = useRef(onError)

  onDecodedRef.current = onDecoded
  onErrorRef.current = onError

  useEffect(() => {
    let cancelled = false

    setState('loading')
    decode(src, { key: cipherKey })
      .then(result => {
        if (cancelled) return
        setState('loaded')
        onDecodedRef.current?.(result)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState('error')
        const err = error instanceof Error ? error : new Error(String(error))

        onErrorRef.current?.(err)
      })

    return () => {
      cancelled = true
    }
  }, [src, cipherKey])

  if (state === 'loading') return <>{fallback ?? null}</>
  if (state === 'error') return null

  return <>{children ?? null}</>
}
