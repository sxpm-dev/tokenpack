import type { ReactNode } from 'react'

interface SectionTitleProps {
  children: ReactNode
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="text-xs font-semibold text-tp-muted uppercase tracking-widest mb-4">
      {children}
    </h2>
  )
}
