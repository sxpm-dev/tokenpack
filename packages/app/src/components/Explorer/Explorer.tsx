'use client'

import { Chip, Input } from '@heroui/react'
import { FilesIcon, LockIcon } from '@phosphor-icons/react'
import type { DecodeSource } from '@tokenpack/browser'
import { useMemo, useState } from 'react'

import { Section } from '@/components/EncodeForm/components/Section'

import { EncodingInfo } from './components/EncodingInfo'
import { EntryListView } from './components/EntryListView'
import { FilePreview } from './components/FilePreview'
import { buildTree, FileTree } from './components/FileTree'
import { PackHeader } from './components/PackHeader'
import { describeSource, SourceInput } from './components/SourceInput'
import { useSmartDecode } from './hooks/useSmartDecode'

interface ExplorerProps {
  source: DecodeSource | null
  sourceLabel: string
  onSelectFile: (file: File) => void
  onSelectURL: (url: string) => void
}

export function Explorer({ source, sourceLabel, onSelectFile, onSelectURL }: ExplorerProps) {
  const [decodeKey, setDecodeKey] = useState('')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const { pack, loading, error, metrics, info } = useSmartDecode(source, decodeKey)

  const effectiveSelected = pack?.isPack()
    ? selectedPath && pack.list.includes(selectedPath)
      ? selectedPath
      : null
    : pack && !pack.isDiff()
      ? pack.list[0] || ''
      : null

  const tree = useMemo(() => {
    if (!pack || !pack.isPack()) return []

    return buildTree(pack.entries)
  }, [pack])

  return (
    <div className="flex flex-col gap-3">
      <Section description="Drop a token, choose a file, or paste a URL." title="Source">
        <SourceInput
          source={source}
          sourceLabel={sourceLabel || describeSource(source)}
          onSelectFile={onSelectFile}
          onSelectURL={onSelectURL}
        />
      </Section>

      <div className="flex flex-col gap-1.5">
        <Input
          fullWidth
          aria-label="Decryption key"
          className="!rounded-2xl"
          placeholder="Decryption key (only if the token was encrypted)"
          type="password"
          value={decodeKey}
          variant="secondary"
          onChange={e => setDecodeKey(e.target.value)}
        />
        {decodeKey && (
          <Chip color="warning" size="sm" variant="soft">
            <LockIcon size={12} /> AES-256
          </Chip>
        )}
      </div>

      {loading && <div className="text-[12px] text-white/45 px-1">Decoding…</div>}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-[12px] text-red-400 font-mono whitespace-pre-wrap">
          {error}
        </div>
      )}

      {pack?.isPack() && (
        <Section description="Files inside the decoded pack." title="Contents">
          <div className="flex flex-col gap-3">
            <PackHeader metrics={metrics} pack={pack} />
            {info && <EncodingInfo info={info} />}
            <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_2fr]">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] px-1 py-1 max-h-[32rem] overflow-y-auto scroll-smooth">
                <FileTree
                  nodes={tree}
                  selectedPath={effectiveSelected}
                  onSelect={setSelectedPath}
                />
              </div>
              <div className="min-w-0">
                {effectiveSelected ? (
                  <FilePreview key={effectiveSelected} pack={pack} path={effectiveSelected} />
                ) : (
                  <EmptyPreview />
                )}
              </div>
            </div>
          </div>
        </Section>
      )}

      {pack && !pack.isPack() && (
        <>
          <Section description="Files inside the decoded pack." title="Contents">
            <div className="flex flex-col gap-2.5">
              <PackHeader metrics={metrics} pack={pack} />
              {info && <EncodingInfo info={info} />}
              <EntryListView
                pack={pack}
                selectedPath={effectiveSelected}
                onSelect={setSelectedPath}
              />
            </div>
          </Section>

          {effectiveSelected !== null && !pack.isDiff() && (
            <Section
              description="Auto preview by file extension. Use Download for any binary."
              title="Preview"
            >
              <FilePreview key={effectiveSelected} pack={pack} path={effectiveSelected} />
            </Section>
          )}
        </>
      )}

      {!source && !loading && !error && (
        <div className="text-[12px] text-white/35 px-1">
          Build a token in the Build tab, or drop an existing token here.
        </div>
      )}
    </div>
  )
}

function EmptyPreview() {
  return (
    <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.015] px-6 py-12 flex flex-col items-center justify-center gap-3 text-center min-h-[12rem]">
      <FilesIcon className="text-white/20" size={28} weight="duotone" />
      <div className="flex flex-col gap-1">
        <div className="text-[12px] text-white/55">Select a file from the tree.</div>
        <div className="text-[10px] text-white/30 font-mono tracking-tight">
          ↑ ↓ navigate · ← → fold · home/end jump
        </div>
      </div>
    </div>
  )
}
