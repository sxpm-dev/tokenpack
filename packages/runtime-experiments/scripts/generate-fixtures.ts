/**
 * Pre-generate every fixture every scenario needs. Mirrors a CDN serving
 * pre-encoded static assets — the API routes (`/api/fixtures/[scenario]/[file]`)
 * stream from disk, zero per-request CPU.
 *
 * Each scenario module declares its variants and exports `buildFixtures(ctx)`;
 * this script iterates the registry, runs every scenario's builder in
 * parallel, writes the resulting files into `runtime-fixtures/<scenarioId>/`,
 * and emits a `manifest.json` index covering all of them.
 *
 * Run: yarn workspace tokenpack-runtime-experiments generate:fixtures
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { generatePayload } from '../src/lib/payloads'
import { BUILDERS } from '../src/scenarios/builders'
import { SCENARIOS } from '../src/scenarios/registry'
import type { BuildCtx, FixtureFile, Manifest, ManifestEntry } from '../src/scenarios/types'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.join(HERE, '..')
const OUT_DIR = path.join(PACKAGE_ROOT, 'runtime-fixtures')

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`

  return `${(n / 1024 / 1024).toFixed(2)}MB`
}

const ctx: BuildCtx = {
  payload(kb: number): Uint8Array {
    const obj = generatePayload(kb)

    return new TextEncoder().encode(JSON.stringify(obj))
  },
}

async function buildScenario(
  scenarioId: string,
  build: () => Promise<FixtureFile[]>,
): Promise<ManifestEntry> {
  const t0 = performance.now()
  const dir = path.join(OUT_DIR, scenarioId)

  fs.mkdirSync(dir, { recursive: true })
  // Wipe existing files so a removed-from-buildFixtures fixture doesn't
  // linger and confuse the manifest.
  for (const existing of fs.readdirSync(dir)) {
    fs.unlinkSync(path.join(dir, existing))
  }

  const files = await build()
  const totalBytes = files.reduce((s, f) => s + f.bytes.length, 0)

  for (const file of files) {
    fs.writeFileSync(path.join(dir, file.path), file.bytes)
  }

  const ms = performance.now() - t0

  console.log(
    `[${scenarioId.padEnd(20)}] ${String(files.length).padStart(2)} files  ` +
      `${fmtBytes(totalBytes).padStart(10)}  ${ms.toFixed(0).padStart(5)}ms`,
  )

  return {
    scenarioId,
    files: files.map(f => ({ path: f.path, bytes: f.bytes.length, meta: f.meta })),
  }
}

async function main() {
  console.log('Runtime-experiments fixture generator')
  console.log('======================================\n')

  fs.mkdirSync(OUT_DIR, { recursive: true })

  if (SCENARIOS.length === 0) {
    console.log('(registry empty — no scenarios to build)')
    fs.writeFileSync(
      path.join(OUT_DIR, 'manifest.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), scenarios: [] }, null, 2),
    )

    return
  }

  // Build scenarios in parallel — each owns a different output dir, no contention.
  const entries: ManifestEntry[] = await Promise.all(
    SCENARIOS.map(s => {
      const build = BUILDERS[s.id]

      if (!build) {
        console.warn(`[${s.id}] no builder registered in src/scenarios/builders.ts — skipping`)

        return Promise.resolve<ManifestEntry>({ scenarioId: s.id, files: [] })
      }

      return buildScenario(s.id, () => build(ctx))
    }),
  )

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    scenarios: entries,
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

  const totalFiles = entries.reduce((s, e) => s + e.files.length, 0)

  console.log(`\n→ ${OUT_DIR}`)
  console.log(`  ${entries.length} scenarios · ${totalFiles} fixture files · manifest.json`)
}

main().catch(err => {
  console.error('generate-fixtures failed:', err)
  process.exit(1)
})
