'use client'

import { Card, Chip } from '@heroui/react'
import type { DiffPack, DirPack } from '@tokenpack/browser'
import { useEffect, useMemo, useState } from 'react'

import { formatBytes } from '@/components/EncodeForm'
import {
  imageMimeFor,
  type PreviewKind,
  previewKindFor,
} from '@/components/Explorer/utils/preview-kind'

interface DiffFilePreviewProps {
  basePack: DirPack
  diffPack: DiffPack
  /** Cached "applied" pack — base + diff = next; reuse across previews. */
  appliedPack: DirPack
  path: string
}

interface Loaded {
  kind: PreviewKind
  size: number
  text: string | null
  imageURL: string | null
  downloadURL: string | null
  downloadName: string
  op: 'add' | 'modify' | 'patch' | 'delete' | 'rename'
  fromPath?: string
}

export function DiffFilePreview({ basePack, diffPack, appliedPack, path }: DiffFilePreviewProps) {
  const entry = useMemo(() => diffPack.entries.find(e => e.path === path), [diffPack, path])
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!entry) return
    let cancelled = false
    let createdURL: string | null = null

    extractDiffEntry(entry, basePack, appliedPack)
      .then(bytes => {
        if (cancelled) return

        const kind = previewKindFor(path)
        let text: string | null = null
        let imageURL: string | null = null
        let downloadURL: string | null = null

        if (bytes) {
          const blob = new Blob([bytes as BlobPart], {
            type: kind === 'image' ? imageMimeFor(path) : 'application/octet-stream',
          })

          downloadURL = URL.createObjectURL(blob)
          createdURL = downloadURL

          if (kind === 'text' || kind === 'json') {
            text = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
            if (kind === 'json') {
              try {
                const parsed = JSON.parse(text) as unknown

                text = JSON.stringify(parsed, null, 2)
              } catch {
                /* leave raw */
              }
            }
          } else if (kind === 'image') {
            imageURL = downloadURL
          }
        }

        if (cancelled) {
          if (downloadURL) URL.revokeObjectURL(downloadURL)

          return
        }

        setLoaded({
          kind,
          size: bytes ? bytes.byteLength : 0,
          text,
          imageURL,
          downloadURL,
          downloadName: leafName(path),
          op: entry.op,
          fromPath: entry.fromPath,
        })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : String(e))
      })

    return () => {
      cancelled = true
      if (createdURL) URL.revokeObjectURL(createdURL)
    }
  }, [entry, basePack, appliedPack, path])

  if (!entry) return null

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-[12px] text-red-400 font-mono whitespace-pre-wrap">
        {error}
      </div>
    )
  }

  if (!loaded) {
    return <div className="text-[12px] text-white/35 px-2">Extracting…</div>
  }

  const { kind, size, text, imageURL, downloadURL, downloadName, op, fromPath } = loaded

  return (
    <Card variant="secondary">
      <Card.Content className="p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-white/55 flex items-center gap-2 flex-wrap">
            <Chip color={opChipColor(op)} size="sm" variant="soft">
              {op}
            </Chip>
            <span className="font-mono">{leafName(path)}</span>
            {size > 0 && <span>· {formatBytes(size)}</span>}
            <span>· {kind}</span>
            {fromPath && <span className="text-white/35 text-[10px]">← {fromPath}</span>}
          </span>
          {downloadURL && (
            <a
              className="text-[11px] text-blue-400 hover:text-blue-300 underline shrink-0"
              download={downloadName}
              href={downloadURL}
            >
              Download
            </a>
          )}
        </div>

        {op === 'delete' && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-[11px] text-red-300/70">
            Removed in next. Showing the previous content from base.
          </div>
        )}

        {op === 'rename' && (
          <div className="rounded-lg border border-blue-400/20 bg-blue-400/5 p-3 text-[11px] text-blue-300/70">
            Renamed from <span className="font-mono">{fromPath}</span>. Content unchanged.
          </div>
        )}

        {kind === 'image' && imageURL && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={downloadName}
            className="max-h-72 w-full object-contain rounded-lg border border-white/10 bg-black/40"
            src={imageURL}
          />
        )}

        {(kind === 'text' || kind === 'json') && text !== null && (
          <pre className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/40 p-2.5 text-[11px] leading-5 font-mono text-white/85 whitespace-pre">
            {text}
          </pre>
        )}

        {kind === 'binary' && downloadURL && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[11px] text-white/55">
            Binary content — use the Download link above.
          </div>
        )}
      </Card.Content>
    </Card>
  )
}

async function extractDiffEntry(
  entry: {
    op: 'add' | 'modify' | 'patch' | 'delete' | 'rename'
    path: string
    fromPath?: string
  },
  basePack: DirPack,
  appliedPack: DirPack,
): Promise<Uint8Array | null> {
  switch (entry.op) {
    case 'add':
    case 'modify':
    case 'patch':
      return await appliedPack.extract(entry.path)
    case 'delete':
      return await basePack.extract(entry.path)
    case 'rename':
      return await appliedPack.extract(entry.path)
  }
}

function leafName(path: string): string {
  return path.split('/').filter(Boolean).pop() || path || 'file'
}

function opChipColor(op: 'add' | 'modify' | 'patch' | 'delete' | 'rename') {
  switch (op) {
    case 'add':
      return 'success' as const
    case 'modify':
    case 'patch':
      return 'warning' as const
    case 'delete':
      return 'danger' as const
    case 'rename':
      return 'accent' as const
  }
}
