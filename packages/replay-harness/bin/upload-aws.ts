import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, relative, resolve as resolvePath } from 'node:path'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { resolveTargetArg } from '../src/config/resolve-target.js'
import { isTokenRouterComparisonVariant, type ReplayTokenVariant } from '../src/config/token-variants.js'
import type { PackManifest } from '../src/config/types.js'
import { ROUTER_TOKEN_FILE } from '../src/encode/router-token.js'
import { logger } from '../src/log/logger.js'

const args = process.argv.slice(2)
const tokenRouter = args.includes('--token-router')
const bucket = flagValue('bucket') ?? process.env.REPLAY_UPLOAD_BUCKET ?? 'tokenpack-harness-s3'
const publicBase =
  flagValue('remote-base-url') ??
  flagValue('public-base-url') ??
  process.env.REPLAY_PACK_BASE_URL ??
  'https://d31tszh4x6dwf2.cloudfront.net'
const prefix =
  flagValue('prefix') ??
  `${resolveTargetArg(positional()[0] ?? 'public-demo').id}/${Date.now()}`
const target = resolveTargetArg(positional()[0] ?? 'public-demo')
const fixtureDir = resolvePath(`fixtures/${target.id}`)
const variantsPath = `${fixtureDir}/variants.json`

interface VariantIndex {
  variants: Array<ReplayTokenVariant & { manifestPath: string; fixtureDir: string }>
}

interface UploadItem {
  filePath: string
  objectKey: string
}

function positional(): string[] {
  return args.filter(arg => !arg.startsWith('--'))
}

function flagValue(name: string): string | undefined {
  const flag = args.find(arg => arg.startsWith(`--${name}=`))

  return flag ? flag.slice(flag.indexOf('=') + 1) : undefined
}

function objectPath(variantFixtureDir: string, localPath: string): string {
  const variantPrefix = relative(fixtureDir, variantFixtureDir).replace(/\\/g, '/')

  return variantPrefix ? `${variantPrefix}/${localPath}` : localPath
}

function publicUrl(base: string, objectKey: string): string {
  return new URL(objectKey.replace(/^\/+/, ''), base.endsWith('/') ? base : `${base}/`).href
}

async function loadVariantIndex(): Promise<VariantIndex> {
  if (!existsSync(variantsPath)) {
    throw new Error(`variant index missing: ${variantsPath}; run record first`)
  }

  const index = JSON.parse(await readFile(variantsPath, 'utf8')) as VariantIndex
  const variants = tokenRouter
    ? index.variants.filter(isTokenRouterComparisonVariant)
    : index.variants

  if (tokenRouter && !variants.some(v => v.loadMode === 'router-materialize')) {
    throw new Error(`router variant missing in ${variantsPath}; run record with --token-router`)
  }

  return { variants }
}

async function collectUploadItems(index: VariantIndex): Promise<UploadItem[]> {
  const byKey = new Map<string, UploadItem>()

  for (const variant of index.variants) {
    const manifest = JSON.parse(await readFile(variant.manifestPath, 'utf8')) as PackManifest

    if (manifest.router) {
      const localPath = manifest.router.localPath ?? ROUTER_TOKEN_FILE
      const keyPath = objectPath(variant.fixtureDir, localPath)

      byKey.set(`${prefix}/${keyPath}`, {
        filePath: join(variant.fixtureDir, localPath),
        objectKey: `${prefix}/${keyPath}`,
      })
    }

    for (const pack of manifest.packs) {
      const localPath = pack.localPath ?? `${pack.id}.png`
      const keyPath = objectPath(variant.fixtureDir, localPath)

      byKey.set(`${prefix}/${keyPath}`, {
        filePath: join(variant.fixtureDir, localPath),
        objectKey: `${prefix}/${keyPath}`,
      })
    }
  }

  return [...byKey.values()]
}

async function mapWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++]

        if (item) await fn(item)
      }
    }),
  )
}

const client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' })
const index = await loadVariantIndex()
const items = await collectUploadItems(index)

logger.info(
  {
    target: target.id,
    bucket,
    prefix,
    publicBase,
    variants: index.variants.map(v => v.id),
    files: items.length,
  },
  'uploading replay fixture artifacts',
)

await mapWithConcurrency(items, 8, async item => {
  const body = await readFile(item.filePath)

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: item.objectKey,
      Body: body,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=300',
    }),
  )
})

console.log(`Base URL: ${publicUrl(publicBase, `${prefix}/`)}`)
console.log(`Benchmark flag: --remote-base-url=${publicUrl(publicBase, `${prefix}/`)}`)
