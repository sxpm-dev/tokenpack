'use client'

import { useEffect, useState } from 'react'
import type { Pack } from 'tokenpack/pack/types'

import { decode, type DecodeSource } from '../decode'

export type TokenPackState = 'idle' | 'loading' | 'loaded' | 'error'

export interface TokenPackResult {
  state: TokenPackState
  /** Unified Pack handle (FilePack | DirPack | DiffPack). null while loading or on error. */
  data: Pack | null
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
 *   if (state === 'loaded' && data && !data.isPack()) {
 *     console.log(await data.text())
 *   }
 *   if (data?.isPack()) for (const path of data.list) await data.extract(path)
 */
export function useTokenPack(
  src: DecodeSource | null | undefined,
  options: UseTokenPackOptions = {},
): TokenPackResult {
  const [state, setState] = useState<TokenPackState>(
    src && options.enabled !== false ? 'loading' : 'idle',
  )
  const [data, setData] = useState<Pack | null>(null)
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
