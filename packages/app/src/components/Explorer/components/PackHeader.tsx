import { Chip } from '@heroui/react'
import { CloudIcon, MonitorIcon } from '@phosphor-icons/react'
import type { Pack } from '@tokenpack/browser'

import { formatBytes } from '@/components/EncodeForm'

import type { DecodeMetrics } from '../hooks/useSmartDecode'

interface PackHeaderProps {
  pack: Pack
  metrics?: DecodeMetrics | null
}

export function PackHeader({ pack, metrics }: PackHeaderProps) {
  const kind = pack.isPack() ? 'DirPack' : pack.isDiff() ? 'DiffPack' : 'FilePack'
  const totalSize = pack.entries.reduce(
    (sum, entry) => sum + (typeof entry.size === 'number' ? entry.size : 0),
    0,
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip color={chipColor(kind)} size="sm" variant="soft">
        {kind}
      </Chip>
      <span className="text-[11px] text-white/55">
        {pack.list.length} {pack.list.length === 1 ? 'entry' : 'entries'}
      </span>
      {totalSize > 0 && (
        <span className="text-[11px] text-white/35">· {formatBytes(totalSize)}</span>
      )}

      {metrics && (
        <Chip color={metrics.route === 'server' ? 'warning' : 'success'} size="sm" variant="soft">
          {metrics.route === 'server' ? <CloudIcon size={11} /> : <MonitorIcon size={11} />}
          <span className="ml-1">
            {metrics.route === 'server' ? 'server' : 'client'} · {metrics.durationMs}ms
          </span>
        </Chip>
      )}

      {metrics?.clientError && (
        <span
          className="text-[10px] text-white/35 truncate max-w-[18rem]"
          title={metrics.clientError}
        >
          (client failed: {metrics.clientError})
        </span>
      )}
    </div>
  )
}

function chipColor(kind: 'DirPack' | 'FilePack' | 'DiffPack') {
  if (kind === 'DirPack') return 'success' as const
  if (kind === 'DiffPack') return 'warning' as const

  return 'accent' as const
}
