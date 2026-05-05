import { describe, expect, it } from 'vitest'

import { FEC_MODES } from '../../src/fec/modes'
import { fecRegistry } from '../../src/fec/registry'

describe('fecRegistry', () => {
  it('lists exactly the 4 modes (none, rs-5, rs-15, rs-25)', () => {
    expect([...FEC_MODES]).toEqual(['none', 'rs-5', 'rs-15', 'rs-25'])
  })

  it('byMode roundtrips every declared mode', () => {
    for (const mode of FEC_MODES) {
      const fec = fecRegistry.byMode(mode)

      expect(fec.id).toBe(mode)
    }
  })

  it('byHeaderLevel finds the right mode', () => {
    expect(fecRegistry.byHeaderLevel(0).id).toBe('none')
    expect(fecRegistry.byHeaderLevel(1).id).toBe('rs-5')
    expect(fecRegistry.byHeaderLevel(2).id).toBe('rs-15')
    expect(fecRegistry.byHeaderLevel(3).id).toBe('rs-25')
  })

  it('falls back to NoneFec for unknown header levels', () => {
    expect(fecRegistry.byHeaderLevel(99).id).toBe('none')
  })

  it('NoneFec is a passthrough', () => {
    const fec = fecRegistry.byMode('none')
    const data = Buffer.from('hello world')
    const encoded = fec.encode(data)

    expect(encoded.data.equals(data)).toBe(true)
    expect(fec.decode(encoded.data, data.length).equals(data)).toBe(true)
  })
})
