import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, expect, it } from 'vitest'

import type { TargetConfig } from '../../src/config/types.js'
import { encode } from '../../src/encode/encoder.js'
import { loadAssetStore, writeAssetStore } from '../../src/record/asset-store.js'
import { record } from '../../src/record/recorder.js'
import { runBaseline } from '../../src/replay/baseline.js'
import { runTokenpackSw } from '../../src/replay/tokenpack-sw.js'
import { type FixtureServer, startFixtureServer } from './fixture-server.js'

let origin: FixtureServer
let tmp: string

beforeAll(async () => {
  origin = await startFixtureServer()
  tmp = mkdtempSync(join(tmpdir(), 'replay-harness-captured-app-'))
})

afterAll(async () => {
  await origin.close()
  rmSync(tmp, { recursive: true, force: true })
})

it('replays a captured entry document while the app drives asset requests', async () => {
  const originalTarget: TargetConfig = {
    id: 'fixture',
    url: origin.url,
    journey: { type: 'goto-only' },
    authMode: 'none',
    captureGraceMs: 250,
  }

  const recorded = await record(originalTarget)

  expect(recorded.entryDocument).toBeDefined()

  await writeAssetStore(recorded.assets, tmp, recorded.entryDocument)
  const assetStore = await loadAssetStore(tmp)

  const baseline = await runBaseline(originalTarget, {
    assetStore,
    serveEntryDocument: true,
    tokenDebug: true,
    withReload: false,
    sanity: { screenshotDir: `${tmp}/screenshots`, screenshotPrefix: 'baseline' },
  })
  const urls = new Set(baseline.cold.assetMarkers?.map(marker => marker.url) ?? [])

  expect(urls.has(`${origin.url}a.css`)).toBe(true)
  expect(urls.has(`${origin.url}b.js`)).toBe(true)
  expect(baseline.cold.sanity?.finalUrl).toBe(origin.url)
  expect(baseline.cold.sanity?.screenshotPath).toBeDefined()
  expect(existsSync(baseline.cold.sanity!.screenshotPath!)).toBe(true)
}, 90_000)

it('serves captured app-driven requests from TokenPack through the replay entry', async () => {
  const originalTarget: TargetConfig = {
    id: 'fixture',
    url: origin.url,
    journey: { type: 'goto-only' },
    authMode: 'none',
    captureGraceMs: 250,
  }

  const recorded = await record(originalTarget)

  await writeAssetStore(recorded.assets, tmp, recorded.entryDocument)
  const assetStore = await loadAssetStore(tmp)
  const out = await encode(recorded.assets, `${tmp}/packs`, { minGroupSizeBytes: 0 })
  const packUrls: Record<string, string> = {}

  for (const p of out.packs) {
    const packBytes = readFileSync(p.packPath)

    origin.serveFile(`/captured-app/${p.packId}.png`, 'image/png', new Uint8Array(packBytes))
    packUrls[p.packId] = `${origin.url}captured-app/${p.packId}.png`
  }

  const result = await runTokenpackSw(originalTarget, {
    manifestPath: out.manifestPath,
    packUrls,
    assetStore,
    serveEntryDocument: true,
    tokenDebug: true,
    withReload: false,
  })

  expect(result.cold.fellThrough).toBe(0)
  expect(result.cold.served).toBe(recorded.assets.length)
}, 90_000)
