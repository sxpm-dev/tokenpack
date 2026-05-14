// Record + encode: capture a page's GET responses, build packs on disk.
//
// Usage:
//   yarn ... run record <url-or-targetId> [--min-group-size=<KB>] [--capture-grace-ms=<MS>] [--bundle-chunks=<N>] [--token-router]
//
// Examples:
//   yarn ... run record public-demo
//   yarn ... run record https://playwright.dev
//   yarn ... run record https://example.com --min-group-size=1000
//
// `--min-group-size=<KB>` (default 500) sets the threshold for packing a
// group. Groups below this combined raw size are NOT packed — at replay,
// the page fetches them normally from origin.
// `--capture-grace-ms=<MS>` overrides how long to keep recording after the
// journey and network-idle point. Lazy editor surfaces can request chunks tens
// of seconds after initial load.
// `--bundle-chunks=<N>` additionally writes fixtures/<target>-bundle-N from
// the same recording, forcing all captured assets into N sequence-ordered packs.
// A single-bundle fixture is also written to fixtures/<target>-bundle so all
// benchmark shapes are ready after one record run.
// `--token-router` adds a separate router-token fixture/manifest in addition
// to regular algorithm fixtures. Regular algorithms stay plain pack-format
// tokens; only the router fixture uses TokenPack.router().

import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'

import { resolveTargetArg } from '../src/config/resolve-target.js'
import { encodeReplayVariants } from '../src/encode/encoder.js'
import { logger } from '../src/log/logger.js'
import { installRunLog } from '../src/log/run-log.js'
import { writeAssetStore } from '../src/record/asset-store.js'
import { record } from '../src/record/recorder.js'

const args = process.argv.slice(2)
const positional = args.filter(a => !a.startsWith('--'))
const flags = args.filter(a => a.startsWith('--'))

const arg = positional[0] ?? 'public-demo'
const tokenRouter = flags.includes('--token-router')

const minGroupSizeFlag = flags.find(f => f.startsWith('--min-group-size='))
const minGroupSizeKb = minGroupSizeFlag
  ? Number(minGroupSizeFlag.slice('--min-group-size='.length))
  : 500

if (Number.isNaN(minGroupSizeKb) || minGroupSizeKb < 0) {
  logger.error(
    { flag: minGroupSizeFlag },
    'invalid --min-group-size (expected non-negative number in KB)',
  )
  process.exit(1)
}
const minGroupSizeBytes = minGroupSizeKb * 1024
const captureGraceFlag = flags.find(f => f.startsWith('--capture-grace-ms='))
const captureGraceMs = captureGraceFlag
  ? Number(captureGraceFlag.slice('--capture-grace-ms='.length))
  : null

if (captureGraceMs !== null && (Number.isNaN(captureGraceMs) || captureGraceMs < 0)) {
  logger.error(
    { flag: captureGraceFlag },
    'invalid --capture-grace-ms (expected non-negative number in ms)',
  )
  process.exit(1)
}
const bundleChunksFlag =
  flags.find(f => f.startsWith('--bundle-chunks=')) ??
  flags.find(f => f.startsWith('--chunk-count='))
const bundleChunks = bundleChunksFlag
  ? Number(bundleChunksFlag.slice(bundleChunksFlag.indexOf('=') + 1))
  : null

if (bundleChunks !== null && (!Number.isInteger(bundleChunks) || bundleChunks < 1)) {
  logger.error({ flag: bundleChunksFlag }, 'invalid --bundle-chunks (expected positive integer)')
  process.exit(1)
}

const resolvedTarget = resolveTargetArg(arg)
const target = captureGraceMs === null ? resolvedTarget : { ...resolvedTarget, captureGraceMs }
const fixtureDir = `fixtures/${target.id}`
const recordRunDir = resolvePath(`results/${target.id}-${Date.now()}-record`)
const logPath = `${recordRunDir}/record.log`
const consoleJsonPath = `${recordRunDir}/browser-console.json`
const consoleLogPath = `${recordRunDir}/browser-console.log`
const closeRunLog = installRunLog(logPath)

logger.info(
  {
    id: target.id,
    url: target.url,
    authMode: target.authMode,
    storageStatePath: target.storageStatePath,
    minGroupSizeKb,
    bundleChunks,
    tokenRouter,
    recordRunDir,
    logPath,
    consoleJsonPath,
    consoleLogPath,
  },
  'record starting',
)

try {
  const result = await record(target, { storageStatePath: target.storageStatePath })

  await rm(fixtureDir, { recursive: true, force: true })
  logger.info({ fixtureDir }, 'cleaned fixture dir')

  const assetStorePath = await writeAssetStore(result.assets, fixtureDir, result.entryDocument)

  logger.info(
    {
      assetStorePath,
      assetCount: result.assets.length,
      entryDocument: Boolean(result.entryDocument),
    },
    'wrote isolated asset store',
  )

  const out = await encodeReplayVariants(result.assets, fixtureDir, {
    minGroupSizeBytes,
    tokenRouter,
  })

  logger.info(
    {
      variantCount: out.variants.length,
      variants: out.variants.map(v => v.variant.id),
      indexPath: out.indexPath,
    },
    'record + encode complete',
  )

  async function writeBundleFixture(
    bundleFixtureDir: string,
    forcePackCount: number,
    label: string,
  ): Promise<void> {
    await rm(bundleFixtureDir, { recursive: true, force: true })
    logger.info({ bundleFixtureDir, forcePackCount }, 'cleaned bundle fixture dir')

    const bundleAssetStorePath = await writeAssetStore(
      result.assets,
      bundleFixtureDir,
      result.entryDocument,
    )

    logger.info(
      {
        bundleAssetStorePath,
        assetCount: result.assets.length,
        entryDocument: Boolean(result.entryDocument),
        label,
      },
      'wrote isolated bundle asset store',
    )

    const bundleOut = await encodeReplayVariants(result.assets, bundleFixtureDir, {
      minGroupSizeBytes,
      forcePackId: 'all-recorded-assets',
      forcePackCount,
      allowPackSplit: false,
      tokenRouter,
    })

    logger.info(
      {
        label,
        forcePackCount,
        variantCount: bundleOut.variants.length,
        variants: bundleOut.variants.map(v => ({
          id: v.variant.id,
          packCount: v.packs.length,
        })),
        indexPath: bundleOut.indexPath,
      },
      'record + bundle encode complete',
    )
  }

  await writeBundleFixture(`fixtures/${target.id}-bundle`, 1, 'single')

  if (bundleChunks !== null) {
    await writeBundleFixture(
      `fixtures/${target.id}-bundle-${bundleChunks}`,
      bundleChunks,
      `chunks-${bundleChunks}`,
    )
  }

  await mkdir(recordRunDir, { recursive: true })
  await writeFile(
    consoleJsonPath,
    JSON.stringify(
      {
        target: { id: target.id, url: target.url },
        capturedAt: result.capturedAt,
        consoleMessages: result.consoleMessages,
        pageErrors: result.pageErrors,
      },
      null,
      2,
    ),
    'utf8',
  )
  await writeFile(
    consoleLogPath,
    [
      ...result.consoleMessages.map(m => `[${m.type}] ${m.text}`),
      ...result.pageErrors.map(m => `[pageerror] ${m}`),
      '',
    ].join('\n'),
    'utf8',
  )
  /* eslint-disable no-console */
  console.log('')
  console.log(`Record log:  ${logPath}`)
  console.log(`Console:     ${consoleJsonPath}`)
  console.log(`Console log: ${consoleLogPath}`)
  console.log(`Fixtures:    ${fixtureDir}`)
  console.log(`Bundle:      fixtures/${target.id}-bundle`)
  if (bundleChunks !== null) {
    console.log(`Bundle ${bundleChunks}: fixtures/${target.id}-bundle-${bundleChunks}`)
  }
  console.log('')
  /* eslint-enable no-console */
} finally {
  closeRunLog()
}
