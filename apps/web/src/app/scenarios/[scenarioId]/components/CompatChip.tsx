'use client'

import { Chip, Tooltip } from '@heroui/react'
import { WarningCircleIcon } from '@phosphor-icons/react'

import type { Compat } from '@/scenarios/types'

interface CompatChipProps {
  compat: Compat
}

export function CompatChip({ compat }: CompatChipProps) {
  if (compat === 'full') {
    return (
      <Chip color="success" size="sm" variant="tertiary">
        Full
      </Chip>
    )
  }

  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Chip color="warning" size="sm" variant="tertiary">
          <span className="inline-flex items-center gap-1">
            <WarningCircleIcon size={11} weight="fill" />
            Partial
          </span>
        </Chip>
      </Tooltip.Trigger>
      <Tooltip.Content>
        Needs DecompressionStream(&apos;br&apos;) — Chromium ≥ 124, Firefox ≥ 126, Safari ≥ 18.
      </Tooltip.Content>
    </Tooltip>
  )
}
