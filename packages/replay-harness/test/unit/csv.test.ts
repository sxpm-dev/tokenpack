import { describe, expect, it } from 'vitest'
import { rowsToCsv } from '../../src/report/csv.js'

describe('rowsToCsv', () => {
  it('emits a header row and data rows', () => {
    const csv = rowsToCsv([
      { mode: 'baseline', durationMs: 1234.5, served: 0, fellThrough: 0 },
      { mode: 'tokenpack', durationMs: 987.2, served: 12, fellThrough: 1 },
    ])
    expect(csv).toBe(
      'mode,durationMs,served,fellThrough\n' +
        'baseline,1234.5,0,0\n' +
        'tokenpack,987.2,12,1\n',
    )
  })

  it('escapes commas and quotes in values', () => {
    const csv = rowsToCsv([{ note: 'a,b "c"', n: 1 }])
    expect(csv).toBe('note,n\n"a,b ""c""",1\n')
  })

  it('handles null and undefined as empty', () => {
    const csv = rowsToCsv([{ a: null, b: undefined, c: 3 }])
    expect(csv).toBe('a,b,c\n,,3\n')
  })

  it('returns empty string for empty input', () => {
    expect(rowsToCsv([])).toBe('')
  })
})
