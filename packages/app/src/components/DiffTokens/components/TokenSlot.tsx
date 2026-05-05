'use client'

import { useRef } from 'react'
import { Button, Card } from '@heroui/react'
import { ArrowsClockwiseIcon, ImageSquareIcon } from '@phosphor-icons/react'

interface TokenSlotProps {
  label: string
  file: File | null
  previewUrl: string | null
  onFile: (file: File) => void
  onReset: () => void
}

export function TokenSlot({ label, file, previewUrl, onFile, onReset }: TokenSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Card variant="secondary" className="flex-1 p-3">
      <div className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</div>
      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt={label}
            className="w-full rounded-xl border border-white/10"
            style={{
              imageRendering: 'pixelated',
              maxHeight: '180px',
              objectFit: 'contain',
              background: '#111',
            }}
          />
          <Button
            size="sm"
            variant="secondary"
            onPress={onReset}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ArrowsClockwiseIcon size={11} /> Change
          </Button>
          <div className="text-[11px] text-white/25 text-center mt-1 font-mono truncate">
            {file?.name} · {((file?.size ?? 0) / 1024).toFixed(1)} KB
          </div>
        </div>
      ) : (
        <Button
          variant="secondary"
          onPress={() => inputRef.current?.click()}
          className="min-h-32 w-full border border-dashed border-white/15"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <ImageSquareIcon size={24} className="text-white/30" />
            <span className="text-sm text-white/60">Upload token.png</span>
          </div>
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/avif,image/webp"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
    </Card>
  )
}
