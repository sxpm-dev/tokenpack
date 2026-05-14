import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

import { resolveTargetArg } from '../src/config/resolve-target.js'
import type { PackManifest } from '../src/config/types.js'
import { ROUTER_TOKEN_FILE } from '../src/encode/router-token.js'
import { logger } from '../src/log/logger.js'
import { uploadConfigFromEnv, uploadPack } from '../src/upload/s3-uploader.js'

const arg = process.argv[2] ?? 'public-demo'
const target = resolveTargetArg(arg)

const fixtureDir = `fixtures/${target.id}`
const variantsPath = `${fixtureDir}/variants.json`

const config = uploadConfigFromEnv()
const ts = Date.now()

async function uploadManifest(
  manifestPath: string,
  packDir: string,
  keyPrefix: string,
): Promise<void> {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as PackManifest
  const routerUrl = manifest.router
    ? await uploadPack(
        config,
        `${packDir}/${ROUTER_TOKEN_FILE}`,
        `${target.id}/${ts}-${keyPrefix}-${ROUTER_TOKEN_FILE}`,
      )
    : undefined
  const uploadedPacks = await Promise.all(
    manifest.packs.map(async pack => {
      const packPath = `${packDir}/${pack.id}.png`
      const objectKey = `${target.id}/${ts}-${keyPrefix}-${pack.id}.png`
      const url = await uploadPack(config, packPath, objectKey)

      return { ...pack, url }
    }),
  )

  const updated: PackManifest = {
    ...manifest,
    ...(manifest.router ? { router: { ...manifest.router, url: routerUrl } } : {}),
    packs: uploadedPacks,
  }

  await writeFile(manifestPath, JSON.stringify(updated, null, 2), 'utf8')

  logger.info(
    { manifestPath, packCount: uploadedPacks.length },
    'manifest updated with public URLs',
  )
}

if (existsSync(variantsPath)) {
  const index = JSON.parse(await readFile(variantsPath, 'utf8')) as {
    variants: Array<{ id: string; manifestPath: string; fixtureDir: string }>
  }

  for (const variant of index.variants) {
    await uploadManifest(variant.manifestPath, variant.fixtureDir, variant.id)
  }
} else {
  await uploadManifest(`${fixtureDir}/manifest.json`, fixtureDir, 'legacy')
}
