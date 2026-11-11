interface SummaryCellProps {
  label: string
  value: string
}

export function SummaryCell({ label, value }: SummaryCellProps) {
  return (
    <span className="border-r border-tp-border px-2 py-1.5 last:border-r-0">
      <span className="block text-[8px] tracking-[0.12em] text-tp-soft uppercase">{label}</span>
      <span className="mt-0.5 block text-[11px] text-tp-fg">{value}</span>
    </span>
  )
}
