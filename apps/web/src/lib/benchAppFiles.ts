import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, normalize, resolve } from 'node:path'

const BENCH_APP_ROOT = resolveBenchPublicRoot()

export const BENCH_SIZES = ['small', 'medium', 'large'] as const

export type BenchSize = (typeof BENCH_SIZES)[number]

export interface BenchFixtureStatus {
  ok: boolean
  size: BenchSize
  root: string
  missing: string[]
  counts: {
    modules: number
    styles: number
    images: number
    lazyModules: number
    lazyStyles: number
    lazyImages: number
    routerChunks: number
  } | null
}

interface BenchManifest {
  modules?: BenchManifestEntry[]
  styles?: BenchManifestEntry[]
  assets?: BenchManifestEntry[]
  lazyModules?: BenchManifestEntry[]
  lazyStyles?: BenchManifestEntry[]
  lazyAssets?: BenchManifestEntry[]
}

interface BenchManifestEntry {
  path?: string
}

export function benchPublicFile(name: string): string | null {
  const safe = normalize(name).replace(/^[./\\]+/, '')
  const filePath = join(BENCH_APP_ROOT, safe)

  if (!filePath.startsWith(BENCH_APP_ROOT)) return null
  if (!existsSync(filePath)) return null

  return filePath
}

export function benchAssetFile(parts: string[], size: BenchSize = 'large'): string | null {
  const assetsDir = join(BENCH_APP_ROOT, size, 'assets')
  const safe = normalize(parts.join('/')).replace(/^[./\\]+/, '')
  const filePath = join(assetsDir, safe)

  if (!filePath.startsWith(assetsDir)) return null
  if (!existsSync(filePath)) return null

  return filePath
}

export async function getBenchFixtureStatus(
  size: BenchSize = 'large',
): Promise<BenchFixtureStatus> {
  const fixtureRoot = join(BENCH_APP_ROOT, size)
  const requiredPublic = [
    'index.html',
    'native-chunks.html',
    'native-chunks-random.html',
    'native-single.html',
    'native-single-random.html',
    'bootloader.js',
  ]
  const requiredAssets = [
    'manifest.json',
    'bundle.js',
    'bundle.css',
    'lazy.js',
    'lazy.css',
    'entry-dynamic.js',
    'entry-all.js',
    'router/router.png',
  ]
  const missing = [
    ...requiredPublic
      .filter(name => !existsSync(join(fixtureRoot, name)))
      .map(name => `bench-app/${size}/${name}`),
    ...requiredAssets
      .filter(name => !benchAssetFile(name.split('/'), size))
      .map(name => `${size}/assets/${name}`),
  ]
  let counts: BenchFixtureStatus['counts'] = null

  try {
    const manifestPath = benchAssetFile(['manifest.json'], size)
    const routerDir = join(fixtureRoot, 'assets', 'router')

    if (manifestPath) {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as BenchManifest
      const routerFiles = existsSync(routerDir) ? await readdir(routerDir) : []
      const manifestEntries = [
        ...(manifest.modules ?? []),
        ...(manifest.styles ?? []),
        ...(manifest.assets ?? []),
        ...(manifest.lazyModules ?? []),
        ...(manifest.lazyStyles ?? []),
        ...(manifest.lazyAssets ?? []),
      ]

      for (const entry of manifestEntries) {
        if (!entry.path) continue
        if (!benchAssetFile(entry.path.split('/'), size))
          missing.push(`${size}/assets/${entry.path}`)
      }

      counts = {
        modules: manifest.modules?.length ?? 0,
        styles: manifest.styles?.length ?? 0,
        images: manifest.assets?.length ?? 0,
        lazyModules: manifest.lazyModules?.length ?? 0,
        lazyStyles: manifest.lazyStyles?.length ?? 0,
        lazyImages: manifest.lazyAssets?.length ?? 0,
        routerChunks: routerFiles.filter(file => /^chunk-\d+\.png$/.test(file)).length,
      }
    }
  } catch {
    counts = null
  }

  return {
    ok: missing.length === 0 && counts !== null,
    size,
    root: fixtureRoot,
    missing,
    counts,
  }
}

function resolveBenchPublicRoot(): string {
  const candidates = [
    resolve(process.cwd(), 'public', 'bench-app'),
    resolve(process.cwd(), 'apps', 'web', 'public', 'bench-app'),
    resolve(process.cwd(), '..', '..', 'apps', 'web', 'public', 'bench-app'),
  ]

  return candidates.find(candidate => existsSync(candidate)) ?? candidates[1]
}
