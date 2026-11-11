interface MetricProps {
  label: string
  value: number
  note: string
}

export function Metric({ label, value, note }: MetricProps) {
  return (
    <div className="bg-tp-elev2 p-3.5">
      <div className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">{label}</div>
      <div className="mt-1 font-mono text-[18px] text-tp-fg">{value}</div>
      <div className="mt-1.5 text-[11px] leading-tight text-tp-muted">{note}</div>
    </div>
  )
}
