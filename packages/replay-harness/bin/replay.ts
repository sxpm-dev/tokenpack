// Replay the page through tokenpack mode (sanity, not measurement).
//
// Usage:
//   yarn ... run replay <url-or-targetId> [throttle]

import { resolve as resolvePath } from 'node:path'
import { runTokenpack } from '../src/replay/tokenpack.js'
import { resolveTargetArg } from '../src/config/resolve-target.js'
import { loadManifest } from '../src/replay/manifest-loader.js'
import { startLocalPackServer } from '../src/replay/local-pack-server.js'
import { PRESETS } from '../src/config/throttles.js'
import { logger } from '../src/log/logger.js'

const arg = process.argv[2] ?? 'public-demo'
const throttleName = process.argv[3] ?? 'NONE'

const target = resolveTargetArg(arg)
const throttle = PRESETS[throttleName]
if (!throttle) {
  logger.error({ throttleName, available: Object.keys(PRESETS) }, 'unknown throttle preset')
  process.exit(1)
}

const fixtureDir = resolvePath(`fixtures/${target.id}`)
const manifestPath = `${fixtureDir}/manifest.json`
const manifest = await loadManifest(manifestPath)

const server = await startLocalPackServer(fixtureDir)
const packUrls: Record<string, string> = {}
for (const p of manifest.packs) {
  packUrls[p.id] = `${server.url}${p.id}.png`
}

logger.info(
  {
    url: target.url,
    fixtureDir,
    packCount: manifest.packs.length,
    throttle: throttleName,
    authMode: target.authMode,
  },
  'replay starting',
)

try {
  const result = await runTokenpack(target, {
    manifestPath,
    packUrls,
    throttle: throttleName === 'NONE' ? undefined : throttle,
    storageStatePath: target.storageStatePath,
    extraHeaders: target.extraHeaders,
  })
  const cold = result.cold
  logger.info(
    {
      durationMs: Math.round(cold.durationMs),
      loadEventMs: cold.loadEventMs ? Math.round(cold.loadEventMs) : null,
      served: cold.served,
      fellThrough: cold.fellThrough,
      totalBytes: cold.totalBytes,
    },
    'replay done',
  )
} finally {
  await server.close()
}
