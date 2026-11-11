import type { ReactNode } from 'react'

interface TabGroupProps {
  label: string
  children: ReactNode
}

export function TabGroup({ label, children }: TabGroupProps) {
  return (
    <div className="grid gap-2">
      <div className="font-mono text-[9px] tracking-[0.14em] text-tp-soft uppercase">{label}</div>
      {children}
    </div>
  )
}
