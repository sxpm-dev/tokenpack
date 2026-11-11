'use client'

import { type DiffPack, type DirPack, type Pack } from '@tokenpack/browser'
import { useEffect, useRef, useState } from 'react'

import { decodeBytesWithFallback } from '@/lib/decode-with-fallback'

export interface DiffComputation {
  basePack: DirPack
  nextPack: DirPack
  diffPack: DiffPack
  diffBytes: Uint8Array
  diffObjectURL: string
}

export interface UseComputeDiffApi {
  computation: DiffComputation | null
  loading: boolean
  error: string | null
}

type Resolved =
  | { kind: 'ready'; base: Pack; next: Pack; comp: DiffComputation }
  | { kind: 'error'; base: Pack; next: Pack; message: string }

const NON_DIRPACK_MESSAGE = 'Both tokens must be multi-file packs (DirPack) to compute a diff.'

export function useComputeDiff(base: Pack | null, next: Pack | null): UseComputeDiffApi {
  const [resolved, setResolved] = useState<Resolved | null>(null)
  const previousURL = useRef<string | null>(null)
  const eligible = base !== null && next !== null && base.isPack() && next.isPack()

  useEffect(
    () => () => {
      if (previousURL.current) URL.revokeObjectURL(previousURL.current)
    },
    [],
  )

  useEffect(() => {
    if (!eligible || !base || !next || !base.isPack() || !next.isPack()) return

    let cancelled = false

    computeDiff(base, next)
      .then(comp => {
        if (cancelled) {
          URL.revokeObjectURL(comp.diffObjectURL)

          return
        }
        if (previousURL.current && previousURL.current !== comp.diffObjectURL) {
          URL.revokeObjectURL(previousURL.current)
        }
        previousURL.current = comp.diffObjectURL
        setResolved({ kind: 'ready', base, next, comp })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setResolved({
          kind: 'error',
          base,
          next,
          message: e instanceof Error ? e.message : String(e),
        })
      })

    return () => {
      cancelled = true
    }
  }, [base, next, eligible])

  if (!base || !next) return { computation: null, loading: false, error: null }
  if (!eligible) return { computation: null, loading: false, error: NON_DIRPACK_MESSAGE }

  const matches = resolved && resolved.base === base && resolved.next === next

  if (!matches) return { computation: null, loading: true, error: null }
  if (resolved.kind === 'ready') return { computation: resolved.comp, loading: false, error: null }

  return { computation: null, loading: false, error: resolved.message }
}

async function computeDiff(base: DirPack, next: DirPack): Promise<DiffComputation> {
  // The base pack carries its source-decoded `diffTo` callback; calling it
  // produces a real diff token packaged with the source algorithm. We then
  // decode it back to a DiffPack for in-app rendering.
  const result = (await base.diffTo(next)) as { bytes: Uint8Array; objectURL: string }
  const { pack: diffPackUnknown } = await decodeBytesWithFallback(result.bytes)

  if (!diffPackUnknown.isDiff()) {
    throw new Error('diff token did not decode to a DiffPack — unexpected')
  }

  return {
    basePack: base,
    nextPack: next,
    diffPack: diffPackUnknown as DiffPack,
    diffBytes: result.bytes,
    diffObjectURL: result.objectURL,
  }
}
