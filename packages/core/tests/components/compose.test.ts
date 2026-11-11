import { describe, expect, it } from 'vitest'

import { composeEnvironments, composeOptions } from '../../src/components/compose'
import { enumOption } from '../../src/components/options'

describe('composeOptions', () => {
  it('namespaces keys per component', () => {
    const out = composeOptions({
      compressor: { level: enumOption([4, 6, 11], 11) },
      surface: { channels: enumOption([3, 4], 3) },
    })

    expect(out['compressor.level']).toBeDefined()
    expect(out['surface.channels']).toBeDefined()
  })

  it('skips empty component schemas', () => {
    const out = composeOptions({
      codec: {},
      drawer: {},
      surface: { channels: enumOption([3], 3) },
    })

    expect(Object.keys(out)).toEqual(['surface.channels'])
  })

  it('returns empty object when all components have empty schemas', () => {
    expect(composeOptions({ codec: {}, drawer: {} })).toEqual({})
  })
})

describe('composeEnvironments', () => {
  it('intersects environment sets across components', () => {
    expect(
      composeEnvironments([{ environments: ['node', 'browser'] }, { environments: ['node'] }]),
    ).toEqual(['node'])
  })

  it('treats undefined environments as both', () => {
    expect(composeEnvironments([{}, { environments: ['browser'] }])).toEqual(['browser'])
  })

  it('returns both when no constraints', () => {
    expect(composeEnvironments([])).toEqual(['node', 'browser'])
  })
})
