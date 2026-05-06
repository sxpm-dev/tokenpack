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
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
      }`}
      href={href}
      onClick={onNavigate}
    >
      <Icon className="text-accent mr-2" size={18} weight={active ? 'fill' : 'regular'} />
      {label}
    </Link>
  )
}
