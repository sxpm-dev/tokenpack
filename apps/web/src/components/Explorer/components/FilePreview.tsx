'use client'

import { CaretRightIcon, DownloadSimpleIcon } from '@phosphor-icons/react'
import type { Pack } from '@tokenpack/browser'
import { useEffect, useState } from 'react'

import { formatBytes } from '@/components/EncodeForm'

import { getFileIconConfig, leafName } from '../utils/file-icon'
import { imageMimeFor, type PreviewKind, previewKindFor } from '../utils/preview-kind'

interface FilePreviewProps {
  pack: Pack
  path: string
}

interface Loaded {
  kind: PreviewKind
  size: number
  text: string | null
  imageURL: string | null
  downloadURL: string
  downloadName: string
}

export function FilePreview({ pack, path }: FilePreviewProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let createdURL: string | null = null

    extractFor(pack, path)
      .then(bytes => {
        if (cancelled) return

        const kind = previewKindFor(path)
        const blob = new Blob([bytes as BlobPart], {
          type: kind === 'image' ? imageMimeFor(path) : 'application/octet-stream',
        })
        const downloadURL = URL.createObjectURL(blob)

        createdURL = downloadURL

        let text: string | null = null
        let imageURL: string | null = null

        if (kind === 'text' || kind === 'json') {
          text = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
          if (kind === 'json') {
            try {
              const parsed = JSON.parse(text) as unknown

              text = JSON.stringify(parsed, null, 2)
            } catch {
              /* fall back to raw on invalid JSON */
            }
          }
        } else if (kind === 'image') {
          imageURL = downloadURL
        }

        if (cancelled) {
          URL.revokeObjectURL(downloadURL)

          return
        }

        setLoaded({
          kind,
          size: bytes.byteLength,
          text,
          imageURL,
          downloadURL,
          downloadName: leafName(path),
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
  }, [pack, path])

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-400 font-mono whitespace-pre-wrap">
        {error}
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-6 text-[12px] text-tp-muted">
        Extracting…
      </div>
    )
  }

  const { Icon, tint } = getFileIconConfig(leafName(path))

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-3 py-2 border-b border-white/[0.06] bg-white/[0.015]">
        <div className="flex items-center gap-2 min-w-0 flex-1 text-[12px]">
          <Icon className={`shrink-0 ${tint}`} size={14} weight="duotone" />
          <Breadcrumb path={path} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-tp-muted font-mono tabular-nums">
            {formatBytes(loaded.size)}
          </span>
          <span className="text-white/15">·</span>
          <span className="text-[10px] text-tp-muted uppercase tracking-[0.08em]">
            {loaded.kind}
          </span>
          <a
            className="ml-1 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            download={loaded.downloadName}
            href={loaded.downloadURL}
          >
            <DownloadSimpleIcon size={12} weight="bold" />
            Download
          </a>
        </div>
      </header>

      <div className="p-3">
        {loaded.kind === 'image' && loaded.imageURL && (
          <div className="rounded-lg border border-tp-border bg-black/40 p-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={loaded.downloadName}
              className="max-h-[60vh] max-w-full object-contain"
              src={loaded.imageURL}
            />
          </div>
        )}

        {(loaded.kind === 'text' || loaded.kind === 'json') && loaded.text !== null && (
          <pre className="max-h-[60vh] overflow-auto rounded-lg border border-white/8 bg-black/50 px-3 py-2.5 text-[11px] leading-[1.6] font-mono text-tp-fg whitespace-pre scroll-smooth">
            {loaded.text}
          </pre>
        )}

        {loaded.kind === 'binary' && (
          <div className="rounded-lg border border-tp-border bg-white/[0.02] px-4 py-6 text-center text-[12px] text-tp-muted">
            Binary content — use the Download link above.
          </div>
        )}
      </div>
    </div>
  )
}

function Breadcrumb({ path }: { path: string }) {
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) {
    return <span className="font-mono text-tp-fg truncate">{leafName(path)}</span>
  }

  const segments = parts.slice(0, -1)
  const leaf = parts[parts.length - 1]

  return (
    <span className="flex items-center gap-1 min-w-0 truncate">
      {segments.map((seg, i) => (
        <span key={`${seg}-${i}`} className="flex items-center gap-1 shrink-0">
          <span className="text-tp-muted font-mono">{seg}</span>
          <CaretRightIcon className="text-tp-muted" size={10} />
        </span>
      ))}
      <span className="font-mono font-medium text-white truncate">{leaf}</span>
    </span>
  )
}

async function extractFor(pack: Pack, path: string): Promise<Uint8Array> {
  if (pack.isDiff()) {
    throw new Error('DiffPack entries cannot be extracted directly. Apply against a prev DirPack.')
  }
  if (pack.isPack()) return await pack.extract(path)

  return await pack.content()
}
