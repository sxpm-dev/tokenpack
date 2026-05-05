import { Card } from '@heroui/react'
import type { ArchiveTimeEntry } from '@/app/api/benchmark/archives/route'
import { fmtArchiveBytes, fmtArchiveMs } from '../utils'

interface ArchiveBaselinesProps {
  entries: ArchiveTimeEntry[]
}

export function ArchiveBaselines({ entries }: ArchiveBaselinesProps) {
  if (!entries.length) return null

  return (
    <Card variant="secondary" className="space-y-2.5 px-3.5 py-3">
      <div className="text-[10px] text-white/30 uppercase tracking-widest">
        Traditional archive baselines
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {entries.map(b => (
          <div key={b.format} className="space-y-1.5 rounded-lg bg-white/[0.035] px-3 py-2">
            <div className="text-white/60 text-xs font-mono font-semibold">{b.format}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-mono">
              <span className="text-white/30">encode</span>
              <span className="text-white/70">{fmtArchiveMs(b.encodeMs)}</span>
              <span className="text-white/30">decode</span>
              <span className="text-white/70">{fmtArchiveMs(b.decodeMs)}</span>
              <span className="text-white/30">size</span>
              <span className="text-white/70">{fmtArchiveBytes(b.bytes)}</span>
              <span className="text-white/30">ratio</span>
              <span className="text-white/70">
                {Math.round(b.bytes / b.originalBytes * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
