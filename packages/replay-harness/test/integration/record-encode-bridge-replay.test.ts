import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, expect, it } from 'vitest'

import type { ReplayTokenVariant } from '../../src/config/token-variants.js'
import type { TargetConfig } from '../../src/config/types.js'
import { encode } from '../../src/encode/encoder.js'
import { record } from '../../src/record/recorder.js'
import { runTokenpack } from '../../src/replay/tokenpack.js'
import { type FixtureServer, startFixtureServer } from './fixture-server.js'

let server: FixtureServer
let tmp: string

beforeAll(async () => {
  server = await startFixtureServer()
  tmp = mkdtempSync(join(tmpdir(), 'replay-harness-bridge-'))
})

afterAll(async () => {
  await server.close()
  rmSync(tmp, { recursive: true, force: true })
})

it('streams pack via browser fetch and serves all sub-resources', async () => {
  const target: TargetConfig = {
    id: 'fixture',
    url: server.url,
    journey: { type: 'goto-only' },
    authMode: 'none',
    captureGraceMs: 500,
  }

  const recorded = await record(target)
  const out = await encode(recorded.assets, tmp, { minGroupSizeBytes: 0 })

  const packUrls: Record<string, string> = {}

  for (const p of out.packs) {
    const packBytes = readFileSync(p.packPath)

    server.serveFile(`/${p.packId}.png`, 'image/png', new Uint8Array(packBytes))
    packUrls[p.packId] = `${server.url}${p.packId}.png`
  }

  const result = await runTokenpack(target, {
    manifestPath: out.manifestPath,
    packUrls,
  })

  expect(result.cold.served).toBe(recorded.assets.length)
  expect(result.cold.fellThrough).toBe(0)
}, 90_000)

it.each([
  [
    {
      id: 'linear-deflate-c3',
      algo: 'linear-deflate',
      channels: 3,
      loadMode: 'full',
      packCompressor: 'deflate-9',
    },
    'extract-full-fetch',
  ],
  [
    {
      id: 'pixel-range-stream-deflate-c3',
      algo: 'pixel-range-stream-deflate',
      channels: 3,
      loadMode: 'stream',
      packCompressor: 'deflate-9',
    },
    'extract-on-demand',
  ],
  [
    {
      id: 'pixel-range-none-range-stream',
      algo: 'pixel-range-none',
      channels: 3,
      loadMode: 'range-stream',
      packCompressor: 'deflate-9',
    },
    'extract-range-stream',
  ],
  [
    {
      id: 'pixel-range-none-range-fetch',
      algo: 'pixel-range-none',
      channels: 3,
      loadMode: 'range-fetch',
      packCompressor: 'deflate-9',
    },
    'extract-range-fetch',
  ],
  [
    {
      id: 'pixel-range-none-range-fetch-all',
      algo: 'pixel-range-none',
      channels: 3,
      loadMode: 'range-fetch-all',
      packCompressor: 'deflate-9',
    },
    'extract-range-fetch-all',
  ],
  [
    {
      id: 'pixel-range-none-range-stream-all',
      algo: 'pixel-range-none',
      channels: 3,
      loadMode: 'range-stream-all',
      packCompressor: 'deflate-9',
    },
    'extract-range-stream-all',
  ],
  [
    {
      id: 'pixel-range-none-range-stream-batch',
      algo: 'pixel-range-none',
      channels: 3,
      loadMode: 'range-stream-batch',
      packCompressor: 'deflate-9',
    },
    'extract-range-stream-batch',
  ],
] satisfies Array<
  [
    ReplayTokenVariant,
    (
      | 'extract-full-fetch'
      | 'extract-on-demand'
      | 'extract-range-fetch'
      | 'extract-range-stream'
      | 'extract-range-fetch-all'
      | 'extract-range-stream-all'
      | 'extract-range-stream-batch'
    ),
  ]
>)(
  'replays %s with the intended browser strategy',
  async (variant, strategy) => {
    const target: TargetConfig = {
      id: 'fixture',
      url: server.url,
      journey: { type: 'goto-only' },
      authMode: 'none',
      captureGraceMs: 500,
    }

    const recorded = await record(target)
    const out = await encode(recorded.assets, `${tmp}/${variant.id}`, {
      minGroupSizeBytes: 0,
      variant,
    })

    const packUrls: Record<string, string> = {}

    for (const p of out.packs) {
      const packBytes = readFileSync(p.packPath)

      server.serveFile(`/${variant.id}/${p.packId}.png`, 'image/png', new Uint8Array(packBytes))
      packUrls[p.packId] = `${server.url}${variant.id}/${p.packId}.png`
    }

    const result = await runTokenpack(target, {
      manifestPath: out.manifestPath,
      packUrls,
      strategy,
      tokenDebug: true,
    })
    const packMarkers = result.cold.assetMarkers?.filter(marker => marker.source === 'pack') ?? []
    const cacheMisses = packMarkers.filter(marker => marker.cacheState === 'miss')

    expect(result.cold.served).toBe(recorded.assets.length)
    expect(result.cold.fellThrough).toBe(0)
    expect(packMarkers).toHaveLength(recorded.assets.length)
    expect(cacheMisses).toHaveLength(out.packs.length)
    expect(packMarkers.every(marker => marker.cacheState !== undefined)).toBe(true)
    expect(packMarkers.every(marker => marker.packInitMs !== undefined)).toBe(true)
    expect(packMarkers.every(marker => marker.fileFetchMs !== undefined)).toBe(true)
  },
  90_000,
)
