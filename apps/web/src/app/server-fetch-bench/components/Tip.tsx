import { fmtMs } from '../utils'

interface TipPayload {
  name: string
  value: number
  color: string
}

interface TipProps {
  active?: boolean
  payload?: TipPayload[]
  label?: string
  unit?: string
}

export function Tip({ active, payload, label, unit }: TipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-zinc-900 border border-tp-border rounded-xl p-3 text-xs shadow-xl">
      <div className="text-tp-muted mb-2 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-tp-muted">{p.name}</span>
          <span className="text-white font-mono ml-auto pl-4">
            {unit === 'ms' ? fmtMs(p.value) : `${p.value.toFixed(1)} MB/s`}
          </span>
        </div>
      ))}
    </div>
  )
}
