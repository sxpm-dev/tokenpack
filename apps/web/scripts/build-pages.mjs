/** Build a disposable static edition without modifying the local server application. */
import { cp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const web = fileURLToPath(new URL('../', import.meta.url))
const root = path.resolve(web, '../..')
const stage = path.join(root, 'apps/.pages-build')
const basePath = process.env.PAGES_BASE_PATH ?? '/tokenpack'
if (basePath && !/^\/[a-zA-Z0-9_-]+$/.test(basePath))
  throw new Error('PAGES_BASE_PATH must be empty or one path segment')
await rm(stage, { recursive: true, force: true })
await mkdir(stage, { recursive: true })
// Resolve the same workspace-specific compiler and dependencies as apps/web.
await symlink(path.join(web, 'node_modules'), path.join(stage, 'node_modules'), 'dir')
for (const file of [
  'src',
  'content',
  'next.config.ts',
  'tsconfig.json',
  'postcss.config.mjs',
  'package.json',
]) {
  await cp(path.join(web, file), path.join(stage, file), { recursive: true })
}
await mkdir(path.join(stage, 'public'), { recursive: true })
await cp(path.join(web, 'public'), path.join(stage, 'public'), {
  recursive: true,
  filter: source => !source.startsWith(path.join(web, 'public/bench-app')),
})
await rm(path.join(stage, 'src/app/api'), { recursive: true, force: true })
await rm(path.join(stage, 'src/app/scenarios/[scenarioId]'), { recursive: true, force: true })
const pages = {
  'browser-fetch-bench': ['Browser fetch — saved runs', ['browser-fetch']],
  'json-playground': ['JSON paths — saved runs', ['json']],
  'apply-diff-bench': ['Apply diff — saved runs', ['apply-diff']],
  'partial-fetch': ['Partial fetch — saved runs', ['partial-fetch']],
  'benchmarks/app': ['Application delivery — saved runs', ['bench-app']],
  'bench-app': ['Application delivery — saved runs', ['bench-app']],
  'scenarios/diff-versioning': ['Diff matrix — saved runs', ['diff-matrix']],
  'scenarios/component-bundle': ['Component bundle — saved runs', ['scenario']],
  'scenarios/ssr-streaming': ['SSR streaming — saved runs', ['scenario']],
  'scenarios/inline-data-uri': ['Inline data URI — saved runs', ['scenario']],
  'scenarios/stream-boot': ['Stream boot — saved runs', ['scenario']],
  'scenarios/sw-cache': ['Service worker cache — saved runs', ['scenario']],
}
for (const [route, [title, scopes]] of Object.entries(pages)) {
  const dir = path.join(stage, 'src/app', route)
  // Remove unused local runner components too: some reference types from their page.
  const layout = await readFile(path.join(dir, 'layout.tsx'), 'utf8').catch(() => null)
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  if (layout !== null) await writeFile(path.join(dir, 'layout.tsx'), layout)
  await writeFile(
    path.join(dir, 'page.tsx'),
    `import { SavedBenchmarks } from '@/components/SavedBenchmarks/SavedBenchmarks'\nexport default function Page() { return <SavedBenchmarks title=${JSON.stringify(title)} scopes={${JSON.stringify(scopes)}} /> }\n`,
  )
}
const configPath = path.join(stage, 'next.config.ts')
let config = await readFile(configPath, 'utf8')
config = config.replace(
  'reactStrictMode: true,',
  `reactStrictMode: true,\n  output: 'export',\n  basePath: ${JSON.stringify(basePath)},\n  trailingSlash: true,\n  images: { unoptimized: true },\n  eslint: { ignoreDuringBuilds: true },`,
)
await writeFile(configPath, config)
// Explicit baseline selection prevents a later run from silently changing the published evidence.
const baseline = path.join(
  web,
  'benchmark-results/baselines/2026-11-11T05-15-18Z-runtime-optimized',
)
const saved = path.join(stage, 'public/saved-benchmarks')
await mkdir(saved, { recursive: true })
for (const name of [
  'results.json',
  'provenance.json',
  'REPORT.md',
  'comparison.json',
  'manifest.json',
  'analysis.json',
  'playgrounds',
])
  await cp(path.join(baseline, name), path.join(saved, name), { recursive: true })
const stats = spawnSync(process.execPath, [
  path.join(root, 'node_modules/tsx/dist/cli.mjs'),
  path.join(web, 'scripts/export-static-stats.ts'), baseline, path.join(saved, 'extended.json'),
], { cwd: web, stdio: 'inherit' })
if (stats.status !== 0) process.exit(stats.status ?? 1)
const index = []
for (const file of (await readdir(path.join(saved, 'playgrounds'))).sort()) {
  if (!file.endsWith('.json')) continue
  const record = JSON.parse(await readFile(path.join(saved, 'playgrounds', file), 'utf8'))
  index.push({ file, scope: record.scope, config: record.config })
}
await writeFile(path.join(saved, 'index.json'), JSON.stringify(index))
await writeFile(path.join(stage, 'public/.nojekyll'), '')
const result = spawnSync(
  process.execPath,
  [path.join(root, 'node_modules/next/dist/bin/next'), 'build'],
  {
    cwd: stage,
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_PUBLIC_STATIC_SITE: 'true',
      NEXT_PUBLIC_BASE_PATH: basePath,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
)
if (result.status !== 0) process.exit(result.status ?? 1)
console.log(`Static site: ${path.join(stage, 'out')} (${index.length} saved runs)`)
