'use client'

import { useEffect, useState } from 'react'
import type { DecodeResult } from 'tokenpack/decode-result'

import { decode, type DecodeSource } from '../decode'

export type TokenPackState = 'idle' | 'loading' | 'loaded' | 'error'

export interface TokenPackResult {
  state: TokenPackState
  /** Unified decode result (file or dir). null while loading or on error. */
  data: DecodeResult | null
  error: Error | null
}

export interface UseTokenPackOptions {
  key?: string
  /** Auto-fetch on src change. Defaults to true. */
  enabled?: boolean
}

/**
 * Reactive hook that fetches and decodes a TokenPack image.
 *
 *   const { state, data, error } = useTokenPack('/profile.png')
 *   if (state === 'loaded' && data?.type === 'file') {
 *     console.log(new TextDecoder().decode(data.payload))
 *   }
 *   if (data?.type === 'dir') data.entries.forEach(e => …)
 */
export function useTokenPack(
  src: DecodeSource | null | undefined,
  options: UseTokenPackOptions = {},
): TokenPackResult {
  const [state, setState] = useState<TokenPackState>(
    src && options.enabled !== false ? 'loading' : 'idle',
  )
  const [data, setData] = useState<DecodeResult | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!src || options.enabled === false) {
      setState('idle')
      setData(null)
      setError(null)

      return
    }

    let cancelled = false

    setState('loading')
    setError(null)

    decode(src, { key: options.key })
      .then(result => {
        if (cancelled) return
        setData(result)
        setState('loaded')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e : new Error(String(e)))
        setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [src, options.key, options.enabled])

  return { state, data, error }
}
