import { ArrowDownIcon, ArrowUpIcon } from '@phosphor-icons/react'

interface PctBadgeProps {
  base: number
  value: number
}

export function PctBadge({ base, value }: PctBadgeProps) {
  const diff = value - base
  const pct = Math.abs((diff / base) * 100).toFixed(1)
  const smaller = diff < 0

  return (
    <span
      className={`flex items-center gap-0.5 font-mono text-xs px-1.5 py-0.5 rounded-full ${
        smaller ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
      }`}
    >
      {smaller ? <ArrowDownIcon size={10} /> : <ArrowUpIcon size={10} />}
      {pct}%
    </span>
  )
}
