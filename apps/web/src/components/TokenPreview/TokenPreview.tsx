'use client'

import { useState } from 'react'

import { formatBytes } from '@/components/EncodeForm'

interface TokenPreviewProps {
  url: string
  fileName: string
  /** Optional bold label rendered before filename (e.g., "Base", "Diff"). */
  label?: string
  /** Optional className for the outer wrapper. */
  className?: string
  /** Optional className for the image element (e.g., to cap height in grids). */
  imageClassName?: string
  /** Token byte size — rendered as "· 4.0 KB" in the header. */
  size?: number
  /** Reference size for ratio readout (e.g. next-token bytes for diff). */
  compareSize?: number
  /** Label for the comparison reference (default "next"). */
  compareLabel?: string
}

interface Dimensions {
  width: number
  height: number
}

export function TokenPreview({
  url,
  fileName,
  label,
  className = '',
  imageClassName = '',
  size,
  compareSize,
  compareLabel = 'next',
}: TokenPreviewProps) {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null)

  const ratio =
    typeof size === 'number' && typeof compareSize === 'number' && compareSize > 0
      ? size / compareSize
      : null

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="truncate">
          {label && <span className="text-tp-fg font-medium">{label}</span>}
          {label && <span className="text-tp-muted"> · </span>}
          <span className="font-mono text-tp-muted">{fileName}</span>
          {dimensions && (
            <span className="text-tp-muted">
              {' '}
              · {dimensions.width} × {dimensions.height}
            </span>
          )}
          {typeof size === 'number' && (
            <span className="text-tp-muted"> · {formatBytes(size)}</span>
          )}
          {ratio !== null && (
            <span
              className="text-emerald-400/80"
              title={`${formatBytes(size!)} / ${formatBytes(compareSize!)} of ${compareLabel}`}
            >
              {' '}
              · {(ratio * 100).toFixed(1)}% of {compareLabel}
            </span>
          )}
        </span>
        <a
          className="text-blue-400 hover:text-blue-300 underline shrink-0"
          download={fileName}
          href={url}
        >
          Download
        </a>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={label ? `${label} token` : 'Token'}
        className={`w-full rounded-lg border border-tp-border bg-black/40 ${imageClassName}`}
        src={url}
        style={{ imageRendering: 'pixelated' }}
        onLoad={e => {
          const img = e.currentTarget

          setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
        }}
      />
    </div>
  )
}
