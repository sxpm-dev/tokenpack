import type { ReactNode } from 'react'

import { LandingNav } from '@/components/LandingNav/LandingNav'

interface UseCasesLayoutProps {
  children: ReactNode
}

export default function UseCasesLayout({ children }: UseCasesLayoutProps) {
  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <LandingNav />
      {children}
    </div>
  )
}
