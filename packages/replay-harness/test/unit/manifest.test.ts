import { describe, expect, it } from 'vitest'
import type { CapturedAsset } from '../../src/config/types.js'
import { buildManifest } from '../../src/encode/manifest.js'

const asset = (url: string, seq: number, ct: string): CapturedAsset => ({
  url,
  seq,
  status: 200,
  headers: { 'content-type': ct },
  body: new Uint8Array([1, 2, 3]),
  rawBytes: 3,
  wireBytes: null,
  contentEncoding: null,
})

describe('buildManifest', () => {
  it('groups assets in the same host+dir into one pack', () => {
    const m = buildManifest([
      asset('https://cdn.x.com/svc/editor/1.0.0/a.js', 0, 'application/javascript'),
      asset('https://cdn.x.com/svc/editor/1.0.0/b.js', 1, 'application/javascript'),
    ])
    expect(m.packs.length).toBe(1)
    expect(m.assets.every(a => a.packId === m.packs[0]!.id)).toBe(true)
  })

  it('separates different services into different packs', () => {
    const m = buildManifest([
      asset('https://cdn.x.com/svc/editor/1.0.0/a.js', 0, 'application/javascript'),
      asset('https://cdn.x.com/svc/platform/1.2.1/b.js', 1, 'application/javascript'),
    ])
    expect(m.packs.length).toBe(2)
    expect(new Set(m.assets.map(a => a.packId)).size).toBe(2)
  })

  it('sorts manifest assets by capture sequence', () => {
    const m = buildManifest([
      asset('https://x.com/lib/b.js', 5, 'application/javascript'),
      asset('https://x.com/lib/a.js', 1, 'application/javascript'),
    ])
    expect(m.assets[0]?.url).toBe('https://x.com/lib/a.js')
    expect(m.assets[1]?.url).toBe('https://x.com/lib/b.js')
  })

  it('passes status and headers through untouched', () => {
    const m = buildManifest([asset('https://x.com/lib/a.js', 0, 'application/javascript')])
    expect(m.assets[0]?.status).toBe(200)
    expect(m.assets[0]?.headers['content-type']).toBe('application/javascript')
  })

  it('uses urlToInternalPath for internalPath', () => {
    const m = buildManifest([asset('https://x.com/lib/a.js?v=1', 0, 'application/javascript')])
    expect(m.assets[0]?.internalPath.startsWith('x.com/lib/a.')).toBe(true)
  })

  it('dedupes assets sharing the same URL, keeping first-seen', () => {
    const m = buildManifest([
      asset('https://x.com/lib/a.js', 0, 'application/javascript'),
      asset('https://x.com/lib/a.js', 5, 'application/javascript'),
    ])
    expect(m.assets.length).toBe(1)
  })
})
