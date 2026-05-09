import { readFile, writeFile } from 'node:fs/promises'
import type { PackManifest } from '../src/config/types.js'
import { uploadConfigFromEnv, uploadPack } from '../src/upload/s3-uploader.js'
import { resolveTargetArg } from '../src/config/resolve-target.js'
import { logger } from '../src/log/logger.js'

const arg = process.argv[2] ?? 'public-demo'
const target = resolveTargetArg(arg)

const fixtureDir = `fixtures/${target.id}`
const manifestPath = `${fixtureDir}/manifest.json`

const config = uploadConfigFromEnv()
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as PackManifest

// Upload every pack referenced by the manifest, write the public URL back
// onto each pack entry. The benchmark step reads the URLs from here.
const ts = Date.now()
const uploadedPacks = await Promise.all(
  manifest.packs.map(async pack => {
    const packPath = `${fixtureDir}/${pack.id}.png`
    const objectKey = `${target.id}/${ts}-${pack.id}.png`
    const url = await uploadPack(config, packPath, objectKey)
    return { ...pack, url }
  }),
)

const updated: PackManifest = { ...manifest, packs: uploadedPacks }
await writeFile(manifestPath, JSON.stringify(updated, null, 2), 'utf8')

logger.info(
  { manifestPath, packCount: uploadedPacks.length },
  'manifest updated with public URLs',
)
