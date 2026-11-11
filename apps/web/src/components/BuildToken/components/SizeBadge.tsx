import { ArrowRightIcon } from '@phosphor-icons/react'

import { formatBytes, type SizeStats } from '@/components/EncodeForm'

import { PctBadge } from './PctBadge'

interface SizeBadgeProps {
  stats: SizeStats
}

export function SizeBadge({ stats }: SizeBadgeProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-sm flex-wrap">
        <span className="text-tp-muted font-mono">{formatBytes(stats.inputBytes)}</span>
        <ArrowRightIcon className="text-tp-muted" size={14} />
        <span className="text-tp-fg font-mono font-semibold">{formatBytes(stats.tokenBytes)}</span>
        <PctBadge base={stats.inputBytes} value={stats.tokenBytes} />
        <span className="text-tp-muted text-xs">
          {stats.tokenBytes < stats.inputBytes
            ? `${formatBytes(stats.inputBytes - stats.tokenBytes)} smaller`
            : `${formatBytes(stats.tokenBytes - stats.inputBytes)} larger`}
        </span>
      </div>

      {(stats.gzipBytes !== null || stats.brotliBytes !== null) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-tp-muted pl-0.5">
          <span className="text-tp-muted">vs</span>
          {stats.gzipBytes !== null && (
            <span className="flex items-center gap-1.5">
              <span className="font-mono">.zip / .tar.gz</span>
              <span className="font-mono text-tp-muted">{formatBytes(stats.gzipBytes)}</span>
              <PctBadge base={stats.inputBytes} value={stats.gzipBytes} />
            </span>
          )}
          {stats.brotliBytes !== null && (
            <span className="flex items-center gap-1.5">
              <span className="font-mono">.br</span>
              <span className="font-mono text-tp-muted">{formatBytes(stats.brotliBytes)}</span>
              <PctBadge base={stats.inputBytes} value={stats.brotliBytes} />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
