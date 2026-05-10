import type { SortDescriptor } from 'react-aria-components'

import type { ExtBenchRow } from '@/lib/bench-types'

export type SortKey = keyof ExtBenchRow | 'roundTrip'

export const fmtMs = (ms: number): string => `${ms.toFixed(1)}ms`

export const fmtBytes = (b: number): string =>
  b < 1024
    ? `${b}B`
    : b < 1024 * 1024
      ? `${(b / 1024).toFixed(0)}KB`
      : `${(b / 1024 / 1024).toFixed(2)}MB`

export const fmtArchiveMs = (ms: number): string =>
  ms < 1 ? `${ms.toFixed(2)}ms` : `${ms.toFixed(1)}ms`

export const fmtArchiveBytes = (b: number): string =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1024 / 1024).toFixed(2)}MB`

function getSortValue(row: ExtBenchRow, key: SortKey): number | string {
  if (key === 'roundTrip') return row.roundTripMs
  const v = row[key as keyof ExtBenchRow]

  if (v === undefined || v === null) return ''

  return typeof v === 'number' ? v : String(v)
}

export function sortRows(rows: ExtBenchRow[], descriptor: SortDescriptor): ExtBenchRow[] {
  const key = (descriptor.column ?? 'ratio') as SortKey
  const asc = descriptor.direction === 'ascending'

  return [...rows].sort((a, b) => {
    if (a.error && !b.error) return 1
    if (!a.error && b.error) return -1
    const av = getSortValue(a, key)
    const bv = getSortValue(b, key)
    const cmp =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))

    return asc ? cmp : -cmp
  })
}
