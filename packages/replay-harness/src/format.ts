/** Format milliseconds. `null`/`undefined` → "—". */
export const fmtMs = (ms: number | null | undefined): string =>
  ms === null || ms === undefined ? '—' : `${Math.round(ms)} ms`

/** Format a byte count as B/KB/MB. `null`/`undefined` → "—". */
export const fmtBytes = (n: number | null | undefined): string => {
  if (n === null || n === undefined) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`

  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export const fmtPct = (n: number): string => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

/** "+123 ms" / "-50 ms" — explicit sign. */
export const fmtSign = (n: number): string => {
  const r = Math.round(n)

  return `${r >= 0 ? '+' : ''}${r} ms`
}

export const fmtRatio = (n: number | null): string => (n === null ? 'n/a' : n.toFixed(2))
