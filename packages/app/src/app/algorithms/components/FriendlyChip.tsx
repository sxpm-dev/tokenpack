import { Chip } from '@heroui/react'

interface FriendlyChipProps {
  value: 'yes' | 'partial' | 'no'
  label: string
}

export function FriendlyChip({ value, label }: FriendlyChipProps) {
  return (
    <Chip size="sm" variant={value === 'no' ? 'tertiary' : 'secondary'}>
      {label}
    </Chip>
  )
}
