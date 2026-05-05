'use client'

import { forwardRef } from 'react'
import { Button } from '@heroui/react'
import { ArrowsClockwiseIcon, ImageIcon } from '@phosphor-icons/react'

interface UploadAreaProps {
  file: File | null
  previewUrl: string | null
  onPickClick: () => void
  onReset: () => void
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const UploadArea = forwardRef<HTMLInputElement, UploadAreaProps>(
  function UploadArea({ file, previewUrl, onPickClick, onReset, onFileChange }, ref) {
    return (
      <>
        {previewUrl ? (
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Token preview"
              className="w-full rounded-xl border border-white/10"
              style={{
                imageRendering: 'pixelated',
                maxHeight: '260px',
                objectFit: 'contain',
                background: '#111',
              }}
            />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="secondary" onPress={onReset}>
                <ArrowsClockwiseIcon size={12} />
                Change
              </Button>
            </div>
            <div className="mt-2 text-xs text-white/30 text-center font-mono">
              {file?.name} · {((file?.size ?? 0) / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            onPress={onPickClick}
            className="min-h-28 w-full border border-dashed border-white/15"
          >
            <div className="flex flex-col items-center gap-3">
              <ImageIcon size={26} className="text-white/30" />
              <span className="text-sm text-white/60">Click to upload a token.png</span>
            </div>
          </Button>
        )}

        <input
          ref={ref}
          type="file"
          accept="image/png,image/avif,image/webp"
          className="hidden"
          onChange={onFileChange}
        />
      </>
    )
  },
)
