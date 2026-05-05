import { CaretUpIcon } from '@phosphor-icons/react'
import type { SortDescriptor } from 'react-aria-components'
import type { SortKey } from '../utils'

interface ColHeaderProps {
  label: string
  sortKey: SortKey
  sort: SortDescriptor
}

export function ColHeader({ label, sortKey, sort }: ColHeaderProps) {
  const active = sort.column === sortKey
  return (
    <span className="flex items-center gap-1 whitespace-nowrap select-none">
      {label}
      <CaretUpIcon
        size={10}
        weight="bold"
        className={[
          'transition-transform duration-100',
          active ? 'opacity-60' : 'opacity-0',
          active && sort.direction === 'descending' ? 'rotate-180' : '',
        ].join(' ')}
      />
    </span>
  )
}
