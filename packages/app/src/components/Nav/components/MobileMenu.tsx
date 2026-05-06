'use client'

import { Drawer } from '@heroui/react'
import { ListIcon, XIcon } from '@phosphor-icons/react'
import Link from 'next/link'
import { useState } from 'react'

import { NAV_LINKS, type NavLinkItem } from '../links'

interface MobileMenuProps {
  pathname: string
}

// `Drawer.Trigger` and `Drawer.CloseTrigger` already render a <button>. Wrapping
// our own <Button> inside produced <button><button/></button>, which is invalid
// HTML and causes a hydration error. We render the icon directly inside the
// trigger and use Tailwind classes to match HeroUI's icon-button look.
const triggerButtonClass =
  'inline-flex items-center justify-center h-8 w-8 rounded-lg text-white/55 hover:bg-white/5 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30'

export function MobileMenu({ pathname }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger aria-label="Open navigation" className={triggerButtonClass}>
        <ListIcon size={18} />
      </Drawer.Trigger>

      <Drawer.Backdrop>
        <Drawer.Content className="max-w-72" placement="left">
          <Drawer.Dialog>
            <Drawer.Header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <Drawer.Heading className="text-sm font-semibold tracking-tight text-white">
                TokenPack
              </Drawer.Heading>
              <Drawer.CloseTrigger aria-label="Close navigation" className={triggerButtonClass}>
                <XIcon size={16} />
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body className="flex flex-col gap-1 p-3">
              {NAV_LINKS.map(item => (
                <MobileNavItem
                  key={item.href}
                  active={pathname === item.href}
                  item={item}
                  onNavigate={() => setIsOpen(false)}
                />
              ))}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}

interface MobileNavItemProps {
  item: NavLinkItem
  active: boolean
  onNavigate: () => void
}

function MobileNavItem({ item, active, onNavigate }: MobileNavItemProps) {
  const { href, label, icon: Icon } = item

  return (
    <Link
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'
      }`}
      href={href}
      onClick={onNavigate}
    >
      <Icon className="text-accent" size={18} weight={active ? 'fill' : 'regular'} />
      {label}
    </Link>
  )
}
