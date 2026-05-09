import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { record } from '../../src/record/recorder.js'
import { encode } from '../../src/encode/encoder.js'
import { runTokenpack } from '../../src/replay/tokenpack.js'
import type { TargetConfig } from '../../src/config/types.js'
import { startFixtureServer, type FixtureServer } from './fixture-server.js'

let server: FixtureServer
let tmp: string

beforeAll(async () => {
  server = await startFixtureServer()
  tmp = mkdtempSync(join(tmpdir(), 'replay-harness-auth-'))
})

afterAll(async () => {
  await server.close()
  rmSync(tmp, { recursive: true, force: true })
})

it('records and replays a basic-auth-protected page using extraHeaders', async () => {
  const target: TargetConfig = {
    id: 'fixture-private',
    url: `${server.url}private/index.html`,
    journey: { type: 'goto-only' },
    authMode: 'extraHeaders',
    extraHeaders: { Authorization: 'Basic dXNlcjpwYXNz' },
    captureGraceMs: 500,
  }

  const recorded = await record(target, { extraHeaders: target.extraHeaders })
  expect(recorded.assets.length).toBeGreaterThanOrEqual(1)

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
    extraHeaders: target.extraHeaders,
  })
  expect(result.cold.served).toBeGreaterThanOrEqual(1)
}, 60_000)
