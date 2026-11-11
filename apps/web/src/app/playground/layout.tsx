import type { ReactNode } from 'react'

import { LandingNav } from '@/components/LandingNav/LandingNav'

interface PlaygroundLayoutProps {
  children: ReactNode
}

export default function PlaygroundLayout({ children }: PlaygroundLayoutProps) {
  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <LandingNav />
      {children}
    </div>
  )
}
