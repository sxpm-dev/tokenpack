import type { Metadata } from 'next'
import { Nav } from '@/components/Nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'TokenPack Dashboard',
  description: 'Encode and decode tokenpack PNG tokens',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen text-white antialiased">
        <Nav />
        {children}
      </body>
    </html>
  )
}
