import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, beforeAll, expect, it } from 'vitest'

import type { TargetConfig } from '../../src/config/types.js'
import { encode } from '../../src/encode/encoder.js'
import { record } from '../../src/record/recorder.js'
import { runBaseline } from '../../src/replay/baseline.js'
import { runTokenpack } from '../../src/replay/tokenpack.js'
import { type FixtureServer, startFixtureServer } from './fixture-server.js'

let server: FixtureServer
let tmp: string

beforeAll(async () => {
  server = await startFixtureServer()
  tmp = mkdtempSync(join(tmpdir(), 'replay-harness-throttle-'))
})

afterAll(async () => {
  await server.close()
  rmSync(tmp, { recursive: true, force: true })
})

const baseTarget: Omit<TargetConfig, 'url'> = {
  id: 'fixture',
  journey: { type: 'goto-only' },
  authMode: 'none',
  captureGraceMs: 500,
}

it('throttle increases baseline duration', async () => {
  const target: TargetConfig = { ...baseTarget, url: server.url }
  const fast = await runBaseline(target)
  const slow = await runBaseline(target, {
    throttle: { downloadKbps: 100, uploadKbps: 50, rttMs: 500, cpuSlowdownFactor: 1 },
  })

  expect(slow.cold.durationMs).toBeGreaterThan(fast.cold.durationMs * 1.5)
}, 60_000)

it('throttle applies in tokenpack mode (pack download is over the wire)', async () => {
  const target: TargetConfig = { ...baseTarget, url: server.url }
  const recorded = await record(target)
  const out = await encode(recorded.assets, tmp, { minGroupSizeBytes: 0 })

  const packUrls: Record<string, string> = {}

  for (const p of out.packs) {
    const packBytes = readFileSync(p.packPath)

    server.serveFile(`/${p.packId}.png`, 'image/png', new Uint8Array(packBytes))
    packUrls[p.packId] = `${server.url}${p.packId}.png`
  }

  const fast = await runTokenpack(target, { manifestPath: out.manifestPath, packUrls })
  const slow = await runTokenpack(target, {
    manifestPath: out.manifestPath,
    packUrls,
    throttle: { downloadKbps: 100, uploadKbps: 50, rttMs: 500, cpuSlowdownFactor: 1 },
  })

  expect(slow.cold.durationMs).toBeGreaterThan(fast.cold.durationMs * 1.5)
}, 120_000)
