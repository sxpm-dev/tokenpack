'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/',                    label: 'Dashboard' },
  { href: '/algorithms',          label: 'Algorithms' },
  { href: '/benchmark-extended',  label: 'Extended Bench' },
  { href: '/benchmark',           label: 'Benchmark' },
  { href: '/perf',                label: 'Codec Perf' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-white/8 bg-[oklch(0.12_0_0)]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
        <Link href="/" className="text-sm font-semibold tracking-tight text-white">
          TokenPack
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
