import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'TokenPack Runtime Experiments',
  description: 'Side-by-side perf scenarios comparing TokenPack to traditional baselines',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen text-white antialiased">{children}</body>
    </html>
  )
}
