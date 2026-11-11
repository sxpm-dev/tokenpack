'use client'

import { Surface } from '@heroui/react'
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

interface ScenarioCardProps {
  /** Just the scalar fields — passing the full `ScenarioDef` would carry the
   *  variant `run` functions, which a Server Component can't serialize across
   *  the RSC boundary into a Client Component. */
  id: string
  name: string
  description: string
}

/**
 * One row in the homepage scenario index. Links to `/scenarios/<id>`.
 */
export function ScenarioCard({ id, name, description }: ScenarioCardProps) {
  return (
    <Link href={`/scenarios/${id}`}>
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
