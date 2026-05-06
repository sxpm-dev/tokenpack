import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'TokenPack Runtime Experiments',
  description: 'Side-by-side perf scenarios comparing TokenPack to traditional baselines',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className="dark" lang="en">
      <body className="min-h-screen text-white antialiased">{children}</body>
    </html>
  )
}
