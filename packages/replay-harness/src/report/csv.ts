type Cell = string | number | boolean | null | undefined

function escape(v: Cell): string {
  if (v === null || v === undefined) return ''
  const s = String(v)

  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }

  return s
}

export function rowsToCsv(rows: ReadonlyArray<Readonly<Record<string, Cell>>>): string {
  if (rows.length === 0) return ''
  const cols = Object.keys(rows[0]!)
  const header = cols.join(',') + '\n'
  const body = rows.map(r => cols.map(c => escape(r[c])).join(',')).join('\n') + '\n'

  return header + body
}
