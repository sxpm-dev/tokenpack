// Standalone baseline run: time a page load, no interception, no pack needed.
//
// If `fixtures/<id>/storageState.json` exists for this target, it is used
// automatically (created by `yarn ... run login`).
//
// Usage:
//   yarn ... run baseline <url-or-targetId> [throttle] [samples]
//
// Examples:
//   yarn ... run baseline https://playwright.dev
//   yarn ... run baseline https://editor.wix.com FAST_4G 5

import { runBaseline } from '../src/replay/baseline.js'
import { resolveTargetArg } from '../src/config/resolve-target.js'
import { PRESETS } from '../src/config/throttles.js'
import { logger } from '../src/log/logger.js'

const arg = process.argv[2] ?? 'public-demo'
const throttleName = process.argv[3] ?? 'NONE'
const samples = Number(process.argv[4] ?? 1)

const target = resolveTargetArg(arg)
const throttle = PRESETS[throttleName]
if (!throttle) {
  logger.error({ throttleName, available: Object.keys(PRESETS) }, 'unknown throttle preset')
  process.exit(1)
}

logger.info(
  { url: target.url, authMode: target.authMode, throttle: throttleName, samples },
  'baseline starting',
)

const durations: number[] = []
for (let i = 0; i < samples; i++) {
  const result = await runBaseline(target, {
    throttle: throttleName === 'NONE' ? undefined : throttle,
    storageStatePath: target.storageStatePath,
    extraHeaders: target.extraHeaders,
  })
  const cold = result.cold
  durations.push(cold.durationMs)
  logger.info(
    {
      sample: i + 1,
      durationMs: Math.round(cold.durationMs),
      loadEventMs: cold.loadEventMs ? Math.round(cold.loadEventMs) : null,
    },
    'sample',
  )
}

const avg = durations.reduce((s, d) => s + d, 0) / durations.length
logger.info(
  {
    samples,
    avgMs: Math.round(avg),
    minMs: Math.round(Math.min(...durations)),
    maxMs: Math.round(Math.max(...durations)),
  },
  'baseline done',
)
