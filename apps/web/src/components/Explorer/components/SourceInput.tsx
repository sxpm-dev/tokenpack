'use client'

import { Button, Input } from '@heroui/react'
import { ArrowsClockwiseIcon, LinkIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import type { DecodeSource } from '@tokenpack/browser'
import { useEffect, useRef, useState } from 'react'

import { formatBytes } from '@/components/EncodeForm'

interface SourceInputProps {
  source: DecodeSource | null
  sourceLabel: string
  onSelectFile: (file: File) => void
  onSelectURL: (url: string) => void
}

export function SourceInput({ source, sourceLabel, onSelectFile, onSelectURL }: SourceInputProps) {
  const [url, setUrl] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const previewURL = usePreviewURL(source)

  function handleFile(file: File) {
    setUrl('')
    onSelectFile(file)
  }

  function openFilePicker() {
    fileRef.current?.click()
  }

  return (
    <div className="flex flex-col gap-2.5">
      {source ? (
        <SelectedPreview label={sourceLabel} previewURL={previewURL} onReplace={openFilePicker} />
      ) : (
        <DropZone
          dragOver={dragOver}
          onChooseFile={openFilePicker}
          onDragLeave={() => setDragOver(false)}
          onDragOver={() => setDragOver(true)}
          onDrop={file => {
            setDragOver(false)
            handleFile(file)
          }}
        />
      )}

      <input
        ref={fileRef}
        accept="image/*"
        className="hidden"
        type="file"
        onChange={e => {
          const next = e.target.files?.[0]

          if (next) handleFile(next)
          e.target.value = ''
        }}
      />

      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault()
          if (url.trim()) onSelectURL(url.trim())
        }}
      >
        <Input
          fullWidth
          aria-label="Token URL"
          className="flex-1"
          placeholder="…or paste a URL (https://…)"
          value={url}
          variant="secondary"
          onChange={e => setUrl(e.target.value)}
        />
        <Button isDisabled={!url.trim()} size="sm" type="submit" variant="tertiary">
          <LinkIcon className="mr-1.5" size={14} />
          Load
        </Button>
      </form>
    </div>
  )
}

interface DropZoneProps {
  dragOver: boolean
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: (file: File) => void
  onChooseFile: () => void
}

function DropZone({ dragOver, onDragOver, onDragLeave, onDrop, onChooseFile }: DropZoneProps) {
  return (
    <div
      className={`rounded-xl border border-dashed px-4 py-5 text-center transition ${
        dragOver ? 'border-blue-400/60 bg-blue-400/5' : 'border-tp-border'
      }`}
      onDragLeave={e => {
        e.preventDefault()
        onDragLeave()
      }}
      onDragOver={e => {
        e.preventDefault()
        onDragOver()
      }}
      onDrop={e => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]

        if (file) onDrop(file)
      }}
    >
      <div className="text-[12px] text-tp-muted">Drop a token (PNG/WebP/AVIF) here</div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <Button size="sm" variant="tertiary" onPress={onChooseFile}>
          <UploadSimpleIcon className="mr-1.5" size={14} />
          Choose file
        </Button>
      </div>
    </div>
  )
}

interface SelectedPreviewProps {
  label: string
  previewURL: string | null
  onReplace: () => void
}

function SelectedPreview({ label, previewURL, onReplace }: SelectedPreviewProps) {
  return (
    <div className="rounded-xl border border-tp-border bg-white/[0.02] p-2 flex flex-col gap-2">
      <div className="rounded-lg overflow-hidden bg-[#0a0a0a] flex items-center justify-center min-h-[160px]">
        {previewURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="token preview"
            className="max-h-[260px] w-auto object-contain image-pixelated"
            src={previewURL}
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="text-[11px] text-tp-muted py-8">no preview</div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="font-mono text-[11px] text-tp-muted truncate">{label}</span>
        <Button size="sm" variant="tertiary" onPress={onReplace}>
          <ArrowsClockwiseIcon className="mr-1" size={12} />
          Replace
        </Button>
      </div>
    </div>
  )
}

// External-resource sync: createObjectURL <-> source. The setUrl-in-effect
// pattern is the legitimate use case the React docs describe (sync to an
// external system) — see usePreviewURL doc.
/* eslint-disable react-hooks/set-state-in-effect */
function usePreviewURL(source: DecodeSource | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  // Track the latest applied source so we don't loop on re-renders.
  const appliedRef = useRef<DecodeSource | null>(null)

  useEffect(() => {
    if (appliedRef.current === source) return
    appliedRef.current = source

    if (!source) {
      setUrl(null)

      return
    }
    if (typeof source === 'string') {
      setUrl(source)

      return
    }

    let blob: Blob | null = null

    if (source instanceof Blob) blob = source
    else if (source instanceof Uint8Array) blob = new Blob([source as BlobPart])
    else if (source instanceof ArrayBuffer) blob = new Blob([source])

    if (!blob) {
      setUrl(null)

      return
    }

    const objectURL = URL.createObjectURL(blob)

    setUrl(objectURL)

    return () => {
      URL.revokeObjectURL(objectURL)
    }
  }, [source])

  return url
}
/* eslint-enable react-hooks/set-state-in-effect */

export function describeSource(source: DecodeSource | null): string {
  if (source === null) return ''
  if (source instanceof File) return `${source.name} · ${formatBytes(source.size)}`
  if (source instanceof Blob) return `blob · ${formatBytes(source.size)}`
  if (typeof source === 'string') return source
  if (source instanceof Uint8Array) return `bytes · ${formatBytes(source.byteLength)}`
  if (source instanceof ArrayBuffer) return `bytes · ${formatBytes(source.byteLength)}`

  return 'image'
}
