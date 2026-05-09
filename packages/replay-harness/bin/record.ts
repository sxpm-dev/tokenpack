// Record + encode: capture a page's GET responses, build packs on disk.
//
// Usage:
//   yarn ... run record <url-or-targetId> [--min-group-size=<KB>]
//
// Examples:
//   yarn ... run record public-demo
//   yarn ... run record https://playwright.dev
//   yarn ... run record https://example.com --min-group-size=1000
//
// `--min-group-size=<KB>` (default 500) sets the threshold for packing a
// group. Groups below this combined raw size are NOT packed — at replay,
// the page fetches them normally from origin.

import { record } from '../src/record/recorder.js'
import { encode } from '../src/encode/encoder.js'
import { resolveTargetArg } from '../src/config/resolve-target.js'
import { logger } from '../src/log/logger.js'

const args = process.argv.slice(2)
const positional = args.filter(a => !a.startsWith('--'))
const flags = args.filter(a => a.startsWith('--'))

const arg = positional[0] ?? 'public-demo'

const minGroupSizeFlag = flags.find(f => f.startsWith('--min-group-size='))
const minGroupSizeKb = minGroupSizeFlag
  ? Number(minGroupSizeFlag.slice('--min-group-size='.length))
  : 500
if (Number.isNaN(minGroupSizeKb) || minGroupSizeKb < 0) {
  logger.error({ flag: minGroupSizeFlag }, 'invalid --min-group-size (expected non-negative number in KB)')
  process.exit(1)
}
const minGroupSizeBytes = minGroupSizeKb * 1024

const target = resolveTargetArg(arg)

logger.info(
  {
    id: target.id,
    url: target.url,
    authMode: target.authMode,
    storageStatePath: target.storageStatePath,
    minGroupSizeKb,
  },
  'record starting',
)

const result = await record(target, { storageStatePath: target.storageStatePath })
const out = await encode(result.assets, `fixtures/${target.id}`, { minGroupSizeBytes })

logger.info(
  {
    packCount: out.packs.length,
    manifestPath: out.manifestPath,
    statsPath: out.statsPath,
    totalAssets: out.manifest.assets.length,
  },
  'record + encode complete',
)
