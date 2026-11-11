export type BenchScope = 'full' | 'random'

export interface BenchPathEntry {
  path: string
}

export interface BenchManifestSelection<
  ModuleEntry extends BenchPathEntry,
  StyleEntry extends BenchPathEntry,
  AssetEntry extends BenchPathEntry,
> {
  modules: ModuleEntry[]
  styles: StyleEntry[]
  assets: AssetEntry[]
}

const RANDOM_RATIO = 0.5
const RANDOM_SEED = 'tokenpack-bench-v1'

export function parseBenchScope(value: string | null): BenchScope {
  return value === 'random' || value === 'half' ? 'random' : 'full'
}

export function selectBenchEntries<
  ModuleEntry extends BenchPathEntry,
  StyleEntry extends BenchPathEntry,
  AssetEntry extends BenchPathEntry,
>(
  scope: BenchScope,
  source: BenchManifestSelection<ModuleEntry, StyleEntry, AssetEntry>,
): BenchManifestSelection<ModuleEntry, StyleEntry, AssetEntry> {
  if (scope === 'full') return source

  return {
    modules: selectRandomHalf(source.modules),
    styles: selectRandomHalf(source.styles),
    assets: selectRandomHalf(source.assets),
  }
}

export function selectRandomHalf<T extends BenchPathEntry>(items: readonly T[]): T[] {
  const target = Math.max(1, Math.ceil(items.length * RANDOM_RATIO))

  return [...items]
    .sort((a, b) => stablePathScore(a.path) - stablePathScore(b.path))
    .slice(0, target)
    .sort((a, b) => a.path.localeCompare(b.path))
}

function stablePathScore(path: string): number {
  let hash = 2166136261
  const value = `${RANDOM_SEED}:${path}`

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}
