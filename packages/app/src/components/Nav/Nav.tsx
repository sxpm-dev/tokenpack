'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { MobileMenu } from './components/MobileMenu'
import { NavLink } from './components/NavLink'
import { NAV_LINKS } from './links'

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-30 border-b border-white/8 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-5">
        <div className="md:hidden">
          <MobileMenu pathname={pathname} />
        </div>

        <Link className="text-sm font-semibold tracking-tight text-white" href="/">
          TokenPack
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map(item => (
            <NavLink key={item.href} active={pathname === item.href} item={item} />
          ))}
        </div>
      </div>
    </nav>
  )
}
