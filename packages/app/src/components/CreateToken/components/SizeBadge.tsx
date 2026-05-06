import { ArrowRightIcon } from '@phosphor-icons/react'

import type { SizeStats } from '../types'
import { formatBytes } from '../utils'
import { PctBadge } from './PctBadge'

interface SizeBadgeProps {
  stats: SizeStats
}

export function SizeBadge({ stats }: SizeBadgeProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-sm flex-wrap">
        <span className="text-white/50 font-mono">{formatBytes(stats.inputBytes)}</span>
        <ArrowRightIcon className="text-white/20" size={14} />
        <span className="text-white/80 font-mono font-semibold">
          {formatBytes(stats.tokenBytes)}
        </span>
        <PctBadge base={stats.inputBytes} value={stats.tokenBytes} />
        <span className="text-white/30 text-xs">
          {stats.tokenBytes < stats.inputBytes
            ? `${formatBytes(stats.inputBytes - stats.tokenBytes)} smaller`
            : `${formatBytes(stats.tokenBytes - stats.inputBytes)} larger`}
        </span>
      </div>

      {(stats.gzipBytes !== null || stats.brotliBytes !== null) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/40 pl-0.5">
          <span className="text-white/20">vs</span>
          {stats.gzipBytes !== null && (
            <span className="flex items-center gap-1.5">
              <span className="font-mono">.zip / .tar.gz</span>
              <span className="font-mono text-white/60">{formatBytes(stats.gzipBytes)}</span>
              <PctBadge base={stats.inputBytes} value={stats.gzipBytes} />
            </span>
          )}
          {stats.brotliBytes !== null && (
            <span className="flex items-center gap-1.5">
              <span className="font-mono">.br</span>
              <span className="font-mono text-white/60">{formatBytes(stats.brotliBytes)}</span>
              <PctBadge base={stats.inputBytes} value={stats.brotliBytes} />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
