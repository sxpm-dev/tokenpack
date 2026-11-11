'use client'

import { Chip } from '@heroui/react'
import { CheckCircleIcon, MinusCircleIcon, WarningOctagonIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

import type { VariantStatus } from '../runner-state'

interface VariantStatusBadgeProps {
  status: VariantStatus
}

interface ChipColorVariant {
  color: 'default' | 'accent' | 'success' | 'warning' | 'danger'
  icon: ReactNode | null
  label: string
}

function colorVariantFor(status: VariantStatus): ChipColorVariant {
  switch (status.state) {
    case 'pending':
      return { color: 'default', icon: null, label: 'queued' }
    case 'running':
      return { color: 'accent', icon: null, label: 'running…' }
    case 'skipped':
      return { color: 'default', icon: <MinusCircleIcon size={12} />, label: 'skipped' }
    case 'errored':
      return {
        color: 'danger',
        icon: <WarningOctagonIcon size={12} weight="fill" />,
        label: 'error',
      }
    case 'done':
      return {
        color: 'success',
        icon: <CheckCircleIcon size={12} weight="fill" />,
        label: 'done',
      }
  }
}

export function VariantStatusBadge({ status }: VariantStatusBadgeProps) {
  const { color, icon, label } = colorVariantFor(status)

  return (
    <Chip color={color} size="sm" variant="tertiary">
      <span className="inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
    </Chip>
  )
}
