import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { record } from '../../src/record/recorder.js'
import { encode } from '../../src/encode/encoder.js'
import { runTokenpackLocal } from '../../src/replay/tokenpack-local.js'
import type { TargetConfig } from '../../src/config/types.js'
import { startFixtureServer, type FixtureServer } from './fixture-server.js'

let server: FixtureServer
let tmp: string

beforeAll(async () => {
  server = await startFixtureServer()
  tmp = mkdtempSync(join(tmpdir(), 'replay-harness-'))
})

afterAll(async () => {
  await server.close()
  rmSync(tmp, { recursive: true, force: true })
})

it('records, encodes, and serves all sub-resources from the pack on replay', async () => {
  const target: TargetConfig = {
    id: 'fixture',
    url: server.url,
    journey: { type: 'goto-only' },
    authMode: 'none',
    captureGraceMs: 500,
  }

  const recorded = await record(target)
  expect(recorded.assets.length).toBeGreaterThanOrEqual(2)

  const out = await encode(recorded.assets, tmp, { minGroupSizeBytes: 0 })
  expect(out.manifest.assets.length).toBe(recorded.assets.length)
  expect(out.packs.length).toBeGreaterThanOrEqual(1)

  const replay = await runTokenpackLocal(target, out.manifestPath, tmp)
  expect(replay.served).toBeGreaterThanOrEqual(2)
  expect(replay.fellThrough).toBeGreaterThanOrEqual(1)
}, 60_000)
