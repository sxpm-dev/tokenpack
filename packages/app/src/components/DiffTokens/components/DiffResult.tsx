'use client'

import { FilesIcon } from '@phosphor-icons/react'
import type { DiffPack, DirPack } from '@tokenpack/browser'
import { useEffect, useState } from 'react'

import { Section } from '@/components/EncodeForm/components/Section'
import { EntryListView } from '@/components/Explorer/components/EntryListView'
import { PackHeader } from '@/components/Explorer/components/PackHeader'
import { TokenPreview } from '@/components/TokenPreview'

import { DiffFilePreview } from './DiffFilePreview'

interface DiffResultProps {
  basePack: DirPack
  diffPack: DiffPack
  /** Optional download link for the diff token PNG. */
  diffObjectURL?: string
  /** Optional download link for the base token PNG (Generate mode). */
  baseObjectURL?: string
  /** Optional download link for the next token PNG (Generate mode). */
  nextObjectURL?: string
  /** Token byte sizes — rendered next to each preview. */
  baseSize?: number
  nextSize?: number
  diffSize?: number
}

export function DiffResult({
  basePack,
  diffPack,
  diffObjectURL,
  baseObjectURL,
  nextObjectURL,
  baseSize,
  nextSize,
  diffSize,
}: DiffResultProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [resolved, setResolved] = useState<{
    base: DirPack
    diff: DiffPack
    applied?: DirPack
    error?: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    basePack
      .apply(diffPack)
      .then(applied => {
        if (cancelled) return
        setResolved({ base: basePack, diff: diffPack, applied })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setResolved({
          base: basePack,
          diff: diffPack,
          error: e instanceof Error ? e.message : String(e),
        })
      })

    return () => {
      cancelled = true
    }
  }, [basePack, diffPack])

  const matches = resolved?.base === basePack && resolved?.diff === diffPack
  const appliedPack = matches ? (resolved?.applied ?? null) : null
  const applyError = matches ? (resolved?.error ?? null) : null

  return (
    <div className="flex flex-col gap-3">
      <Section description="Files changed between base and next." title="Diff">
        <div className="flex flex-col gap-3">
          <PackHeader pack={diffPack} />
          <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_2fr]">
            <div className="rounded-xl border border-white/8 bg-white/[0.02] px-1 py-1 max-h-[32rem] overflow-y-auto scroll-smooth">
              <EntryListView
                pack={diffPack}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
              />
            </div>
            <div className="min-w-0">
              {applyError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-[12px] text-red-400 font-mono whitespace-pre-wrap">
                  {applyError}
                </div>
              )}
              {!applyError && !appliedPack && (
                <div className="text-[12px] text-white/35 px-2">Applying diff…</div>
              )}
              {!applyError && appliedPack && selectedPath && (
                <DiffFilePreview
                  key={selectedPath}
                  appliedPack={appliedPack}
                  basePack={basePack}
                  diffPack={diffPack}
                  path={selectedPath}
                />
              )}
              {!applyError && appliedPack && !selectedPath && <EmptyPreview />}
            </div>
          </div>
        </div>
      </Section>

      {(baseObjectURL || diffObjectURL || nextObjectURL) && (
        <Section description="Encoded tokens (image and dimensions)." title="Tokens">
          <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {baseObjectURL && (
              <TokenPreview
                fileName="base.png"
                imageClassName="max-h-40 object-contain"
                label="Base"
                size={baseSize}
                url={baseObjectURL}
              />
            )}
            {nextObjectURL && (
              <TokenPreview
                fileName="next.png"
                imageClassName="max-h-40 object-contain"
                label="Next"
                size={nextSize}
                url={nextObjectURL}
              />
            )}
            {diffObjectURL && (
              <TokenPreview
                compareLabel="next"
                compareSize={nextSize}
                fileName="diff.png"
                imageClassName="max-h-40 object-contain"
                label="Diff"
                size={diffSize}
                url={diffObjectURL}
              />
            )}
          </div>
        </Section>
      )}
    </div>
  )
}

function EmptyPreview() {
  return (
    <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.015] px-6 py-12 flex flex-col items-center justify-center gap-3 text-center min-h-[12rem]">
      <FilesIcon className="text-white/20" size={28} weight="duotone" />
      <div className="text-[12px] text-white/55">Select a change to preview.</div>
    </div>
  )
}
