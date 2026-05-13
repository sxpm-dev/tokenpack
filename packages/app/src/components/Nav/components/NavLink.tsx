'use client'

import Link from 'next/link'

import type { NavLinkItem } from '../links'

interface NavLinkProps {
  item: NavLinkItem
  active: boolean
  onNavigate?: () => void
}

export function NavLink({ item, active, onNavigate }: NavLinkProps) {
  const { href, label, icon: Icon } = item

  return (
    <Link
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-blue-300/80 bg-white/10 text-white shadow-[0_0_0_1px_rgba(147,197,253,0.55)]'
          : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/70'
      }`}
      href={href}
      onClick={onNavigate}
    >
      <Icon className="text-accent mr-2" size={18} weight={active ? 'fill' : 'regular'} />
      {label}
    </Link>
  )
}
