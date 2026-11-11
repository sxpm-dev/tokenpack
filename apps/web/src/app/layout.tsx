import './globals.css'

import type { Metadata } from 'next'
import { Caveat, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import { Footer } from '@/components/Footer/Footer'

import { Providers } from './providers'

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const instrument = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
})

const caveat = Caveat({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'TokenPack — files as images',
    template: '%s · TokenPack',
  },
  description:
    'Encode files into images. Decode them back. Portable, streaming-decodable containers for data, repos, and AI-agent context.',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      suppressHydrationWarning
      className={`${jetbrains.variable} ${instrument.variable} ${caveat.variable}`}
      dir="ltr"
      lang="en"
    >
      <body>
        <Providers>
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
