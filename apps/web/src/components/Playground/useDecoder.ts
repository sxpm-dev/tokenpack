'use client'

import { useCallback, useRef, useState } from 'react'

export type DecodeResult =
  | {
      kind: 'file'
      name: string | null
      bytes: Uint8Array
      text: string | null
    }
  | {
      kind: 'pack'
      entries: { path: string; size: number }[]
    }
  | {
      kind: 'diff'
      entries: { path: string; op: string }[]
    }
  | {
      kind: 'router'
      entries: { path: string; size: number }[]
    }

interface DecoderApi {
  result: DecodeResult | null
  loading: boolean
  error: string | null
  run: (bytes: Uint8Array) => Promise<void>
}

export function useDecoder(): DecoderApi {
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqIdRef = useRef(0)

  const run = useCallback(async (bytes: Uint8Array) => {
    const reqId = ++reqIdRef.current

    setLoading(true)
    setError(null)
    try {
      const { decode } = await import('@tokenpack/browser')
      const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' })
      const pack = await decode(blob)

      if (reqIdRef.current !== reqId) return

      if (pack.isRouter()) {
        const list = (await pack.list()) as string[]

        setResult({
          kind: 'router',
          entries: list.map(path => ({ path, size: 0 })),
        })
      } else if (pack.isPack()) {
        setResult({
          kind: 'pack',
          entries: pack.entries.map(e => ({ path: e.path, size: e.size })),
        })
      } else if (pack.isDiff()) {
        setResult({
          kind: 'diff',
          entries: pack.entries.map(e => ({
            path: (e as { path: string }).path,
            op: (e as { op?: string }).op ?? 'modify',
          })),
        })
      } else {
        const name = pack.list[0] ?? null
        const payloadBytes = await pack.content()
        let text: string | null

        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(payloadBytes)
        } catch {
          text = null
        }
        setResult({
          kind: 'file',
          name: name || null,
          bytes: payloadBytes,
          text,
        })
      }
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
