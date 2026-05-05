import { useEffect, useState } from 'react'
import { decode, type DecodeSource } from '../decode'

export type TokenPackState = 'idle' | 'loading' | 'loaded' | 'error'

export interface TokenPackResult {
  state: TokenPackState
  data: Uint8Array | null
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
 *   if (state === 'loaded') console.log(new TextDecoder().decode(data!))
 */
export function useTokenPack(
  src: DecodeSource | null | undefined,
  options: UseTokenPackOptions = {},
): TokenPackResult {
  const [state, setState] = useState<TokenPackState>(src && options.enabled !== false ? 'loading' : 'idle')
  const [data, setData] = useState<Uint8Array | null>(null)
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
      .then(bytes => {
        if (cancelled) return
        setData(bytes)
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
