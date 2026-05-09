// Headed login flow: open a real browser at the target URL, let the user log
// in manually, then dump cookies + localStorage to disk. Subsequent record /
// baseline / benchmark runs against the same id reuse the saved state.
//
// Usage:
//   yarn workspace tokenpack-replay-harness run login <url-or-targetId>

import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { chromium } from 'playwright'
import { resolveTargetArg } from '../src/config/resolve-target.js'
import { logger } from '../src/log/logger.js'

const arg = process.argv[2] ?? 'public-demo'
const target = resolveTargetArg(arg)

// Session storage lives outside `fixtures/` so wiping the fixture dir doesn't
// take auth with it. Subsequent record / baseline / benchmark runs find the
// state automatically via resolveTargetArg.
const storageStatePath = target.storageStatePath ?? `session-storages/${target.id}.json`
await mkdir(dirname(storageStatePath), { recursive: true })

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(target.url)

logger.info(
  { url: target.url, storageStatePath },
  'log in manually in the browser, then return here and press ENTER',
)

const rl = createInterface({ input: process.stdin, output: process.stdout })
await rl.question('Press ENTER once logged in to save state and close: ')
rl.close()

await context.storageState({ path: storageStatePath })
logger.info({ storageStatePath }, 'storageState saved')
await browser.close()
