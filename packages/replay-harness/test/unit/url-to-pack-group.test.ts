import { describe, expect, it } from 'vitest'
import { urlToPackGroup } from '../../src/encode/url-to-pack-group.js'

describe('urlToPackGroup', () => {
  it('groups files in the same directory together', () => {
    const a = urlToPackGroup('https://cdn.x.com/services/editor/1.0.0/main.js')
    const b = urlToPackGroup('https://cdn.x.com/services/editor/1.0.0/runtime.js')
    expect(a).toBe(b)
  })

  it('separates different services', () => {
    const a = urlToPackGroup('https://cdn.x.com/services/editor/1.0.0/main.js')
    const b = urlToPackGroup('https://cdn.x.com/services/platform/1.2.1/api.js')
    expect(a).not.toBe(b)
  })

  it('separates different versions of the same service', () => {
    const a = urlToPackGroup('https://cdn.x.com/services/editor/1.0.0/main.js')
    const b = urlToPackGroup('https://cdn.x.com/services/editor/1.0.1/main.js')
    expect(a).not.toBe(b)
  })

  it('separates different hosts', () => {
    const a = urlToPackGroup('https://a.example.com/lib/x.js')
    const b = urlToPackGroup('https://b.example.com/lib/x.js')
    expect(a).not.toBe(b)
  })

  it('produces a filesystem-safe key', () => {
    const key = urlToPackGroup('https://cdn.x.com:8443/services/editor/1.0.0/main.js')
    expect(key).toMatch(/^[a-z0-9._-]+$/)
  })

  it('handles root-level files (no directory)', () => {
    const key = urlToPackGroup('https://example.com/main.js')
    expect(key).toBe('example.com')
  })

  it('handles port', () => {
    const key = urlToPackGroup('https://cdn.x.com:8443/lib/foo.js')
    expect(key).toContain('8443')
  })
})
