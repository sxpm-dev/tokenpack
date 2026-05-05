'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Drawer } from '@heroui/react'
import { ListIcon, XIcon } from '@phosphor-icons/react'
import { NAV_LINKS, type NavLinkItem } from '../links'

interface MobileMenuProps {
  pathname: string
}

export function MobileMenu({ pathname }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="Open navigation"
        >
          <ListIcon size={18} />
        </Button>
      </Drawer.Trigger>

      <Drawer.Backdrop>
        <Drawer.Content placement="left" className="max-w-72">
          <Drawer.Dialog>
            <Drawer.Header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <Drawer.Heading className="text-sm font-semibold tracking-tight text-white">
                TokenPack
              </Drawer.Heading>
              <Drawer.CloseTrigger>
                <Button isIconOnly variant="ghost" size="sm" aria-label="Close navigation">
                  <XIcon size={16} />
                </Button>
              </Drawer.CloseTrigger>
            </Drawer.Header>

            <Drawer.Body className="flex flex-col gap-1 p-3">
              {NAV_LINKS.map(item => (
                <MobileNavItem
                  key={item.href}
                  item={item}
                  active={pathname === item.href}
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
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-white/10 text-white'
          : 'text-white/55 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={18} weight={active ? 'fill' : 'regular'} className="text-accent" />
      {label}
    </Link>
  )
}
