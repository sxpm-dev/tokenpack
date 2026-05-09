'use client'

import type { DiffPack, DirPack, Pack } from '@tokenpack/browser'
import { useEffect, useRef, useState } from 'react'

import { computeDiff as computeDiffPack, encodeDiffTokenViaServer } from '../utils/compute-diff'

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
  // Compute the DiffPack from raw diff bytes (no canvas roundtrip), and ask
  // the server to wrap the bytes in a PNG for the download link.
  const { diffPack, diffBytes } = await computeDiffPack(base, next)
  const token = await encodeDiffTokenViaServer(diffBytes)

  return {
    basePack: base,
    nextPack: next,
    diffPack,
    diffBytes: token.bytes,
    diffObjectURL: token.objectURL,
  }
}
