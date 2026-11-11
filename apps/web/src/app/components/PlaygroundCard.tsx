'use client'

import { Surface } from '@heroui/react'
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface PlaygroundCardProps {
  href: string
  name: string
  description: ReactNode
}

/**
 * One row in the homepage "Playgrounds" index. Same visual shape as
 * `ScenarioCard` but points at a custom-page playground (e.g. `/partial-fetch`)
 * rather than `/scenarios/<id>`.
 */
export function PlaygroundCard({ href, name, description }: PlaygroundCardProps) {
  return (
    <Link href={href}>
      <Surface className="flex items-start justify-between gap-3 p-4 hover:opacity-80 transition-opacity">
        <div className="flex-1">
          <h2 className="text-base font-medium text-white">{name}</h2>
          <p className="mt-1 text-xs text-tp-muted leading-relaxed">{description}</p>
        </div>
        <ArrowRightIcon className="text-tp-muted mt-1" size={18} />
      </Surface>
    </Link>
  )
}
