import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, expect, it } from 'vitest'

import type { CapturedAsset } from '../../src/config/types.js'
import { encode } from '../../src/encode/encoder.js'
import { isStaticJsonAssetUrl } from '../../src/encode/static-json-asset.js'

const tmpDirs: string[] = []

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

it('keeps static json asset groups even below the normal pack-size threshold', async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'replay-harness-static-json-'))

  tmpDirs.push(outDir)

  const staticJsonUrl =
    'https://static.parastorage.com/services/editor-elements/1.15110.0/rb_dsgnsys.corvidBuilder.manifest.min.json'
  const apiJsonUrl = 'https://valeriis-my-site-261.editor.wix.com/_api/editor-web-server/config'
  const smallJsUrl = 'https://static.parastorage.com/services/tiny/1.0.0/tiny.js'
  const out = await encode(
    [
      capturedAsset(0, staticJsonUrl, 'application/json', '{"static":true}'),
      capturedAsset(1, apiJsonUrl, 'application/json', '{"server":true}'),
      capturedAsset(2, smallJsUrl, 'application/javascript', 'window.tiny=true'),
    ],
    outDir,
    { minGroupSizeBytes: 500 * 1024 },
  )
  const urls = out.manifest.assets.map(asset => asset.url)

  expect(urls).toContain(staticJsonUrl)
  expect(urls).not.toContain(apiJsonUrl)
  expect(urls).not.toContain(smallJsUrl)
})

it('classifies static json assets without treating api json as an asset', () => {
  expect(
    isStaticJsonAssetUrl(
      'https://static.parastorage.com/services/editor-elements/1.15110.0/rb_wixui.manifest.min.json',
    ),
  ).toBe(true)
  expect(isStaticJsonAssetUrl('https://pages.parastorage.com/sites/site.json.z?v=3')).toBe(true)
  expect(isStaticJsonAssetUrl('https://example.com/_api/foo.json')).toBe(false)
  expect(isStaticJsonAssetUrl('https://example.com/api/foo.json')).toBe(false)
})

function capturedAsset(
  seq: number,
  url: string,
  contentType: string,
  text: string,
): CapturedAsset {
  const body = new TextEncoder().encode(text)

  return {
    url,
    seq,
    status: 200,
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=7776000, immutable',
    },
    body,
    rawBytes: body.byteLength,
    wireBytes: body.byteLength,
    contentEncoding: null,
  }
}
