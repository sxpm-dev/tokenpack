import { Card, Chip } from '@heroui/react'

import type { AlgoMeta } from '@/lib/algo-catalog'

import { FriendlyChip } from './FriendlyChip'

interface AlgoCardProps {
  algo: AlgoMeta
}

export function AlgoCard({ algo }: AlgoCardProps) {
  return (
    <Card className="border border-white/10 bg-white/2 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-sm font-semibold text-white tracking-tight">{algo.name}</div>
        <Chip size="sm" variant="tertiary" className="font-mono text-[10px]">
          #{algo.id}
        </Chip>
      </div>

      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/48">{algo.description}</p>

      <dl className="grid grid-cols-1 gap-y-1.5 text-[10.5px]">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-white/25">Pixel</dt>
          <dd className="text-white/60 font-mono">{algo.pixelLayout}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-white/25">Write</dt>
          <dd className="text-white/60">{algo.writeStyle}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-white/25">Deps</dt>
          <dd className="text-white/60">{algo.dependencies}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0 text-white/25">Ratio</dt>
          <dd className="text-white/70 font-mono">{algo.approxRatio}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-1.5 border-t border-white/6 pt-2">
        <FriendlyChip value={algo.beFriendly} label="Node.js" />
        <FriendlyChip value={algo.feFriendly} label="Browser" />
        <FriendlyChip value={algo.streamFriendly} label="Stream" />
      </div>

      {algo.options.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {algo.options.map(opt => (
            <Chip key={opt} size="sm" variant="tertiary">
              {opt}
            </Chip>
          ))}
        </div>
      )}
    </Card>
  )
}
