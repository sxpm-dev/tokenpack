'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface EncodeArgs {
  payload: string
  algo: string
  name: string
}

export interface EncodeResultShape {
  bytes: Uint8Array
  objectURL: string
  mediaType?: string
}

interface EncoderApi {
  result: EncodeResultShape | null
  loading: boolean
  error: string | null
  run: (args: EncodeArgs) => Promise<void>
}

export function useEncoder(): EncoderApi {
  const [result, setResult] = useState<EncodeResultShape | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastURLRef = useRef<string | null>(null)
  const reqIdRef = useRef(0)

  // Revoke object URLs on unmount
  useEffect(
    () => () => {
      if (lastURLRef.current) URL.revokeObjectURL(lastURLRef.current)
    },
    [],
  )

  const run = useCallback(async ({ payload, algo, name }: EncodeArgs) => {
    const reqId = ++reqIdRef.current

    setLoading(true)
    setError(null)
    try {
      const { encode } = await import('@tokenpack/browser')
      const opts: { algo: string; name?: string } = { algo }

      if (name.trim()) opts.name = name.trim()
      const r = await encode(payload, opts)

      if (reqIdRef.current !== reqId) return // stale
      const bytes = r.bytes
      const blob = r.blobs?.[0] ?? new Blob([new Uint8Array(bytes)], { type: 'image/png' })
      const objectURL = URL.createObjectURL(blob)

      if (lastURLRef.current) URL.revokeObjectURL(lastURLRef.current)
      lastURLRef.current = objectURL
      setResult({ bytes, objectURL, mediaType: blob.type })
    } catch (err) {
      if (reqIdRef.current !== reqId) return
      setError(err instanceof Error ? err.message : String(err))
      setResult(null)
    } finally {
      if (reqIdRef.current === reqId) setLoading(false)
    }
  }, [])

  return { result, loading, error, run }
}
