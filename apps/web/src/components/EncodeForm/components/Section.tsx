import { Surface } from '@heroui/react'
import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  description: string
  children: ReactNode
  className?: string
}

export function Section({ title, description, children, className = '' }: SectionProps) {
  return (
    <Surface className={`rounded-xl p-3.5 flex flex-col gap-2.5 ${className}`}>
      <div>
        <div className="text-[13px] font-medium">{title}</div>
        <div className="text-[11px] leading-4 text-white/38">{description}</div>
      </div>
      {children}
    </Surface>
  )
}
