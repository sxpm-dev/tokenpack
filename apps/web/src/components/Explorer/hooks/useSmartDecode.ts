'use client'

import { type DecodeSource, type Pack } from '@tokenpack/browser'
import { inspect, type InspectInfo } from '@tokenpack/browser/inspect'
import { useEffect, useState } from 'react'

import {
  type DecodeMetrics,
  type DecodeRoute,
  decodeWithFallback,
} from '@/lib/decode-with-fallback'

export type { DecodeMetrics, DecodeRoute }

export interface UseSmartDecodeApi {
  pack: Pack | null
  loading: boolean
  error: string | null
  metrics: DecodeMetrics | null
  info: InspectInfo | null
}

type Resolved =
  | {
      kind: 'ready'
      source: DecodeSource
      key: string
      pack: Pack
      metrics: DecodeMetrics
      info: InspectInfo | null
    }
  | { kind: 'error'; source: DecodeSource; key: string; message: string }

export function useSmartDecode(source: DecodeSource | null, key: string): UseSmartDecodeApi {
  const [resolved, setResolved] = useState<Resolved | null>(null)

  useEffect(() => {
    if (!source) return

    let cancelled = false

    decodeWithFallback(source, key)
      .then(async ({ pack, metrics }) => {
        if (cancelled) return
        const info = await inspect(source).catch(() => null)

        if (cancelled) return
        setResolved({ kind: 'ready', source, key, pack, metrics, info })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setResolved({
          kind: 'error',
          source,
          key,
          message: e instanceof Error ? e.message : String(e),
        })
      })

    return () => {
      cancelled = true
    }
  }, [source, key])

  if (!source) return { pack: null, loading: false, error: null, metrics: null, info: null }

  const matches = resolved?.source === source && resolved.key === key

  if (!matches) return { pack: null, loading: true, error: null, metrics: null, info: null }
  if (resolved.kind === 'ready') {
    return {
      pack: resolved.pack,
      loading: false,
      error: null,
      metrics: resolved.metrics,
      info: resolved.info,
    }
  }

  return { pack: null, loading: false, error: resolved.message, metrics: null, info: null }
}
