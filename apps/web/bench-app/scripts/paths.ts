import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SIZE_NAMES = ['small', 'medium', 'large'] as const

export type BenchSize = (typeof SIZE_NAMES)[number]

export const SIZE_PRESETS: Record<
  BenchSize,
  {
    modules: number
    styles: number
    images: { small: number; medium: number; large: number }
    lazy: { modules: number; styles: number; smallImages: number; mediumImages: number }
  }
> = {
  small: {
    modules: 40,
    styles: 10,
    images: { small: 20, medium: 4, large: 0 },
    lazy: { modules: 8, styles: 4, smallImages: 8, mediumImages: 2 },
  },
  medium: {
    modules: 160,
    styles: 40,
    images: { small: 80, medium: 20, large: 2 },
    lazy: { modules: 32, styles: 12, smallImages: 28, mediumImages: 8 },
  },
  large: {
    modules: 400,
    styles: 100,
    images: { small: 200, medium: 50, large: 10 },
    lazy: { modules: 80, styles: 30, smallImages: 70, mediumImages: 20 },
  },
}

export const BENCH_ROOT = resolve(HERE, '..')
export const WEB_ROOT = resolve(BENCH_ROOT, '..')
export const PUBLIC_DIR = join(WEB_ROOT, 'public', 'bench-app')
export const FIXTURE_SIZE = parseBenchSize()
export const FIXTURE_DIR = join(PUBLIC_DIR, FIXTURE_SIZE)
export const ASSETS_DIR = join(FIXTURE_DIR, 'assets')
export const SRC_DIR = join(BENCH_ROOT, 'src')
export const RESULTS_DIR = join(BENCH_ROOT, 'results')

export const PUBLIC_BASE = '/bench-app'
export const FIXTURE_BASE = `${PUBLIC_BASE}/${FIXTURE_SIZE}`
export const ASSET_BASE = `${FIXTURE_BASE}/assets`

function parseBenchSize(): BenchSize {
  const flag = process.argv.find(a => a.startsWith('--size='))
  const raw = flag?.slice(flag.indexOf('=') + 1) ?? process.env.BENCH_SIZE ?? 'large'

  return isBenchSize(raw) ? raw : 'large'
}

function isBenchSize(value: string): value is BenchSize {
  return (SIZE_NAMES as readonly string[]).includes(value)
}
