'use client'

import { type ReactNode, useEffect, useState } from 'react'

export interface TocItem {
  value: ReactNode
  id: string
  depth: number
}

interface DocsTocLinksProps {
  items: TocItem[]
}

export function DocsTocLinks({ items }: DocsTocLinksProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )

    for (const item of items) {
      const el = document.getElementById(item.id)

      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <ul className="flex flex-col gap-1.5 text-[12.5px]">
      {items.map(item => {
        const isActive = activeId === item.id
        const indent = Math.max(0, item.depth - 2) * 12

        return (
          <li key={item.id} style={{ paddingLeft: indent }}>
            <a
              className={`block truncate transition-colors ${
                isActive ? 'text-tp-fg' : 'text-tp-muted hover:text-tp-fg'
              }`}
              href={`#${item.id}`}
            >
              {item.value}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
