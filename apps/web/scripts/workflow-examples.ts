import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { decode, decodeRouter, encode, PackBuilder, TokenPack } from '@tokenpack/node'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const source = path.join(root, 'examples/workflows')
const output = path.join(root, 'apps/web/public/examples/workflows')
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
const cases = JSON.parse(await readFile(path.join(root, 'docs/guides/index.json'), 'utf8')) as {
  slug: string
}[]
const selected = process.argv[2]

assert(!selected || cases.some(c => c.slug === selected), `Unknown workflow: ${selected}`)
await mkdir(output, { recursive: true })

async function filesIn(directory: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const name = prefix + entry.name

    if (entry.isDirectory())
      files.push(...(await filesIn(path.join(directory, entry.name), name + '/')))
    else files.push(name)
  }

  return files
}

for (const { slug } of cases.filter(c => !selected || c.slug === selected)) {
  const dir = path.join(source, slug)
  const entries = await Promise.all(
    (await filesIn(dir)).map(async name => ({ name, bytes: await readFile(path.join(dir, name)) })),
  )
  const builder = new PackBuilder()

  for (const entry of entries) builder.withFile(entry.name, entry.bytes)
  const token = await encode(builder, { algo: 'pixel-range-none', compressor: 'deflate-6' })
  const pack = await decode(token.bytes)

  assert(pack.isPack(), 'Expected a directory pack')
  assert.deepEqual([...pack.list].sort(), entries.map(e => e.name).sort())
  for (const entry of entries)
    assert.deepEqual(Buffer.from(await pack.extract(entry.name)), entry.bytes)
  const json = async (name: string) => JSON.parse(await pack.text(name))

  switch (slug) {
    case 'configuration':
      assert.equal((await json('config.json')).alertAfterHours, 24)
      break
    case 'artifact-data':
      assert.equal(
        (await json('data/expenses.json')).reduce(
          (sum: number, row: { amountMinor: number }) => sum + row.amountMinor,
          0,
        ),
        36500,
      )
      break
    case 'portable-app':
      assert.match(await pack.text('app/index.html'), /Monthly cost/)
      assert.equal((await json('state.json')).seats, 4)
      break
    case 'bug-reproduction': {
      const input = await json('input.json')

      assert.equal(
        Math.round(input.unitPriceMinor * input.quantity * (1 - input.discountPercent / 100)),
        (await json('expected.json')).totalMinor,
      )
      break
    }
    case 'agent-checkpoint': {
      const rows = (await pack.text('evidence.csv')).trim().split('\n').slice(1)

      assert.equal(
        rows.reduce((sum, row) => sum + Number(row.split(',')[1]), 0),
        (await json('outputs/totals.json')).totalMinor,
      )
      break
    }
    case 'editable-recipe': {
      const data = await json('data.json')

      assert.equal(data[1].revenue / data[0].revenue, 1.25)
      break
    }
    case 'review-snapshot': {
      const evidence = await json('evidence.json')

      assert.equal(evidence.newMonthlyUSD - evidence.oldMonthlyUSD, 200)
      assert.equal((await json('review.json')).status, 'pending')
      break
    }
    case 'offline-workspace':
      assert.equal((await json('reference/checklist.json')).items.length, 3)
      break
    case 'reference-pack':
      assert.equal((await json('locales/fr.json')).tea, 'Thé vert')
      break
    case 'web-delivery': {
      assert.equal(
        (await json('data/report.json')).values.reduce((a: number, b: number) => a + b, 0),
        60,
      )
      const routerBuilder = new TokenPack()

      for (const entry of entries) routerBuilder.withFile(entry.name, entry.bytes)
      const artifacts = await encode(
        routerBuilder.router({ chunkLayout: 'source-order', fileCompressor: 'deflate-6' }),
      )
      const routerDir = path.join(output, 'web-delivery-router')

      await mkdir(routerDir, { recursive: true })
      for (const artifact of artifacts)
        await writeFile(
          path.join(routerDir, artifact.filename),
          new Uint8Array(await artifact.blob.arrayBuffer()),
        )
      const router = await decodeRouter(path.join(routerDir, 'router.png'))
      assert(router.isRouter(), 'Expected a router pack')

      assert.equal(await router.text('data/report.json'), await pack.text('data/report.json'))
      break
    }
  }
  await writeFile(path.join(output, `${slug}.png`), token.bytes)
  await writeFile(
    path.join(output, `${slug}.json`),
    JSON.stringify(
      {
        schemaVersion: 1,
        kind: slug,
        synthetic: true,
        algorithm: 'pixel-range-none',
        compressor: 'deflate-6',
        sha256: hash(token.bytes),
        byteLength: token.bytes.length,
        files: entries.map(e => ({
          path: e.name,
          byteLength: e.bytes.length,
          sha256: hash(e.bytes),
        })),
      },
      null,
      2,
    ) + '\n',
  )
  console.log(`${slug}: ${entries.length} files restored; data invariant passed`)
}
