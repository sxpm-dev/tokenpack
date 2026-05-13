import { describe, expect, it } from 'vitest'

import { urlToInternalPath } from '../../src/encode/url-to-path.js'

describe('urlToInternalPath', () => {
  it('preserves host and path with safe characters', () => {
    expect(urlToInternalPath('https://cdn.example.com/lib/foo.js')).toBe(
      'cdn.example.com/lib/foo.js',
    )
  })

  it('hashes the query string into the filename', () => {
    const a = urlToInternalPath('https://x.com/a.js?v=1')
    const b = urlToInternalPath('https://x.com/a.js?v=2')

    expect(a).not.toBe(b)
    expect(a.startsWith('x.com/a.')).toBe(true)
  })

  it('replaces unsafe path characters', () => {
    // % becomes _25, : becomes _3a — both arrive literally in URL.pathname.
    expect(urlToInternalPath('https://x.com/a%20b/c:d.js')).toBe('x.com/a_2520b/c_3ad.js')
  })

  it('encodes ports', () => {
    expect(urlToInternalPath('https://x.com:8443/a.js')).toBe('x.com_8443/a.js')
  })

  it('handles missing path', () => {
    expect(urlToInternalPath('https://x.com')).toBe('x.com/_root')
  })

  it('is deterministic', () => {
    const u = 'https://x.com/a.js?v=1&q=2'

    expect(urlToInternalPath(u)).toBe(urlToInternalPath(u))
  })
})
