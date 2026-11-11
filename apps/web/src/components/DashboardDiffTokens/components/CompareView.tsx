'use client'

import type { DecodeSource } from '@tokenpack/browser'
import { useEffect, useState } from 'react'

import { formatBytes } from '@/components/EncodeForm'
import { Section } from '@/components/EncodeForm/components/Section'
import { describeSource, SourceInput } from '@/components/Explorer'
import { useSmartDecode } from '@/components/Explorer/hooks/useSmartDecode'

import { useComputeDiff } from '../hooks/useComputeDiff'
import { DiffResult } from './DiffResult'

export function CompareView() {
  const [baseSource, setBaseSource] = useState<DecodeSource | null>(null)
  const [baseLabel, setBaseLabel] = useState('')
  const [nextSource, setNextSource] = useState<DecodeSource | null>(null)
  const [nextLabel, setNextLabel] = useState('')

  const baseDecoded = useSmartDecode(baseSource, '')
  const nextDecoded = useSmartDecode(nextSource, '')
  const baseSize = useSourceSize(baseSource)
  const nextSize = useSourceSize(nextSource)

  const {
    computation,
    loading: diffLoading,
    error: diffError,
  } = useComputeDiff(baseDecoded.pack, nextDecoded.pack)

  function handleBaseFile(file: File) {
    setBaseSource(file)
    setBaseLabel(`${file.name} · ${formatBytes(file.size)}`)
  }
  function handleBaseURL(url: string) {
    setBaseSource(url)
    setBaseLabel(url)
  }
  function handleNextFile(file: File) {
    setNextSource(file)
    setNextLabel(`${file.name} · ${formatBytes(file.size)}`)
  }
  function handleNextURL(url: string) {
    setNextSource(url)
    setNextLabel(url)
  }

  const decodingError = baseDecoded.error || nextDecoded.error

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Section description="The previous version." title="Base (before)">
          <SourceInput
            source={baseSource}
            sourceLabel={baseLabel || describeSource(baseSource)}
            onSelectFile={handleBaseFile}
            onSelectURL={handleBaseURL}
          />
        </Section>

        <Section description="The new version to compare against." title="Next (after)">
          <SourceInput
            source={nextSource}
            sourceLabel={nextLabel || describeSource(nextSource)}
            onSelectFile={handleNextFile}
            onSelectURL={handleNextURL}
          />
        </Section>
      </div>

      {(baseDecoded.loading || nextDecoded.loading) && (
        <div className="text-[12px] text-tp-muted px-1">Decoding…</div>
      )}

      {decodingError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-[12px] text-red-400 font-mono whitespace-pre-wrap">
          {decodingError}
        </div>
      )}

      {diffLoading && <div className="text-[12px] text-tp-muted px-1">Computing diff…</div>}

      {diffError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-[12px] text-red-400 font-mono whitespace-pre-wrap">
          {diffError}
        </div>
      )}

      {computation && (
        <DiffResult
          basePack={computation.basePack}
          baseSize={baseSize ?? undefined}
          diffObjectURL={computation.diffObjectURL}
          diffPack={computation.diffPack}
          diffSize={computation.diffBytes.byteLength}
          nextSize={nextSize ?? undefined}
        />
      )}

      {!baseSource && !nextSource && (
        <div className="text-[12px] text-tp-muted px-1">
          Drop two pack tokens above to see the structural diff.
        </div>
      )}
    </div>
  )
}

/**
 * Best-effort byte size for a token source. Synchronous for File/Blob/bytes;
 * for URL sources it does a HEAD-then-GET fallback (Content-Length).
 */
/* eslint-disable react-hooks/set-state-in-effect */
function useSourceSize(source: DecodeSource | null): number | null {
  const [size, setSize] = useState<number | null>(() => syncSize(source))

  useEffect(() => {
    const sync = syncSize(source)

    if (sync !== null) {
      setSize(sync)

      return
    }
    if (typeof source !== 'string') {
      setSize(null)

      return
    }

    let cancelled = false

    fetchURLSize(source).then(s => {
      if (!cancelled) setSize(s)
    })

    return () => {
      cancelled = true
    }
  }, [source])

  return size
}
/* eslint-enable react-hooks/set-state-in-effect */

function syncSize(source: DecodeSource | null): number | null {
  if (!source) return null
  if (source instanceof Blob) return source.size
  if (source instanceof Uint8Array) return source.byteLength
  if (source instanceof ArrayBuffer) return source.byteLength

  return null
}

async function fetchURLSize(url: string): Promise<number | null> {
  try {
    const head = await fetch(url, { method: 'HEAD' })

    if (head.ok) {
      const cl = head.headers.get('content-length')

      if (cl) return Number(cl)
    }
  } catch {
    /* fall through */
  }
  try {
    const res = await fetch(url)

    if (!res.ok) return null
    const buf = await res.arrayBuffer()

    return buf.byteLength
  } catch {
    return null
  }
}
