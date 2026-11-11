/**
 * Upload everything under ./assets/ to S3 under a timestamped prefix.
 * Prints the public base URL so it can be passed to `yarn bench --cdn-base=…`
 * or baked into the bootloader via `yarn build:bootloader --cdn-base=…`.
 *
 * Assets are uploaded as-is — the CDN distribution should be configured to
 * brotli/gzip on the edge. (Or upload the .br / .gz siblings too — we do
 * upload them so an origin that respects Content-Encoding will pick them up.)
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, resolve as resolvePath } from 'node:path'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { ASSETS_DIR } from './paths.js'

const args = process.argv.slice(2)
const bucket = flag('bucket') ?? process.env.BENCH_UPLOAD_BUCKET ?? 'tokenpack-harness-s3'
const publicBase =
  flag('public-base-url') ??
  process.env.BENCH_PACK_BASE_URL ??
  'https://d31tszh4x6dwf2.cloudfront.net'
const prefixBase = flag('prefix-base') ?? 'bench-app'
const prefix = flag('prefix') ?? `${prefixBase}/${Date.now()}`
const ASSETS = resolvePath(ASSETS_DIR)

function flag(name: string): string | undefined {
  const f = args.find(a => a.startsWith(`--${name}=`))

  return f ? f.slice(f.indexOf('=') + 1) : undefined
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const name of await readdir(dir)) {
    const full = join(dir, name)
    const st = await stat(full)

    if (st.isDirectory()) yield* walk(full)
    else yield full
  }
}

const MIME: Record<string, string> = {
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.html': 'text/html',
  '.map': 'application/json',
  '.br': 'application/octet-stream',
  '.gz': 'application/octet-stream',
}

function mimeFor(path: string): string {
  for (const ext of Object.keys(MIME)) {
    if (path.endsWith(ext)) return MIME[ext] ?? 'application/octet-stream'
  }

  return 'application/octet-stream'
}

function contentEncoding(path: string): string | undefined {
  if (path.endsWith('.br')) return 'br'
  if (path.endsWith('.gz')) return 'gzip'

  return undefined
}

const client = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' })
const items: string[] = []

for await (const f of walk(ASSETS)) items.push(f)

console.log(`uploading ${items.length} files to s3://${bucket}/${prefix}/`)

let next = 0
const CONC = 8

await Promise.all(
  Array.from({ length: CONC }, async () => {
    while (next < items.length) {
      const i = next++
      const filePath = items[i]

      if (!filePath) continue
      const rel = relative(ASSETS, filePath).replace(/\\/g, '/')
      const objectKey = `${prefix}/${rel}`
      const body = await readFile(filePath)
      const ce = contentEncoding(filePath)
      const realExt = ce
        ? `.${filePath.split('.').slice(-2, -1)[0]}`
        : `.${filePath.split('.').pop()}`

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: body,
          ContentType: ce ? mimeFor(realExt) : mimeFor(filePath),
          ...(ce ? { ContentEncoding: ce } : {}),
          CacheControl: 'public, max-age=300',
        }),
      )
    }
  }),
)

const baseUrl = `${publicBase.replace(/\/$/, '')}/${prefix}/`

console.log(`\nBase URL: ${baseUrl}`)
console.log(`Bench flag: --cdn-base=${baseUrl.replace(/\/$/, '')}`)
