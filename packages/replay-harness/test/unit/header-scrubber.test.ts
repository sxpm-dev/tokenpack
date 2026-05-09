import { describe, expect, it } from 'vitest'
import { scrubHeaders } from '../../src/encode/header-scrubber.js'

describe('scrubHeaders', () => {
  it('keeps content-type and cache-control', () => {
    const out = scrubHeaders({
      'content-type': 'application/javascript',
      'cache-control': 'public, max-age=31536000',
    })
    expect(out).toEqual({
      'content-type': 'application/javascript',
      'cache-control': 'public, max-age=31536000',
    })
  })

  it('strips set-cookie', () => {
    const out = scrubHeaders({
      'content-type': 'text/html',
      'set-cookie': 'session=abc; HttpOnly',
    })
    expect(out['set-cookie']).toBeUndefined()
    expect(out['content-type']).toBe('text/html')
  })

  it('strips authorization echo and any other non-allowlisted', () => {
    const out = scrubHeaders({
      authorization: 'Bearer secret',
      'x-tracking-id': 'tracker',
      'content-type': 'application/json',
    })
    expect(out).toEqual({ 'content-type': 'application/json' })
  })

  it('lowercases keys', () => {
    const out = scrubHeaders({ 'Content-Type': 'text/css', ETAG: '"abc"' })
    expect(out).toEqual({ 'content-type': 'text/css', etag: '"abc"' })
  })

  it('returns a frozen object', () => {
    const out = scrubHeaders({ 'content-type': 'text/css' })
    expect(Object.isFrozen(out)).toBe(true)
  })
})
