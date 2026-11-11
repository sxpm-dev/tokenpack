import type { BenchRow } from './types'

export const fmtMs = (ms: number): string =>
  ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`

export const fmtBytes = (b: number): string =>
  b < 1024
    ? `${b}B`
    : b < 1024 * 1024
      ? `${(b / 1024).toFixed(0)}KB`
      : `${(b / 1024 / 1024).toFixed(2)}MB`

export function avg(rows: BenchRow[], key: keyof BenchRow): number {
  if (!rows.length) return 0

  return rows.reduce((s, r) => s + (r[key] as number), 0) / rows.length
}

export function getRows(data: BenchRow[], condition: string, source: string): BenchRow[] {
  return data.filter(
    r => r.condition === condition && (source === 'avg' || rowSourceId(r) === source),
  )
}

export function rowSourceId(row: Pick<BenchRow, 'source' | 'sourceId'>): string {
  return row.sourceId ?? row.source.replace(/__chunks-\d+__chunk-\d+$/, '')
}
