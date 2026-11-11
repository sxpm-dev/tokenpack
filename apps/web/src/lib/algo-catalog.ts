// Live view of algorithm metadata for the dashboard's algorithms page.
// Reads `algorithmCatalog.list()` at module evaluation; importing
// `@tokenpack/browser` populates the catalog as a side effect.

import '@tokenpack/browser'

import { browserAlgorithmCatalog as algorithmCatalog } from '@tokenpack/browser/algorithms/catalog'

import { type AlgoMeta, buildAlgoMeta, type CatalogPackage } from './algo-meta'

export type { AlgoMeta, CatalogPackage } from './algo-meta'

export const ALGO_CATALOG: AlgoMeta[] = algorithmCatalog
  .list()
  .map(Ctor => buildAlgoMeta(Ctor, ['browser']))

export function mergeNodeCatalog(browserCatalog: AlgoMeta[], nodeCatalog: AlgoMeta[]): AlgoMeta[] {
  const byName = new Map(browserCatalog.map(algo => [algo.name, { ...algo }]))

  for (const nodeAlgo of nodeCatalog) {
    const existing = byName.get(nodeAlgo.name)

    if (existing) {
      existing.implementedIn = packageUnion(existing.implementedIn, 'node')
      existing.mirrored = existing.implementedIn.includes('browser')
      continue
    }

    byName.set(nodeAlgo.name, {
      ...nodeAlgo,
      implementedIn: ['node'],
      mirrored: false,
    })
  }

  return [...byName.values()].sort((a, b) => a.id - b.id)
}

function packageUnion(current: CatalogPackage[], next: CatalogPackage): CatalogPackage[] {
  return current.includes(next) ? current : [...current, next]
}

/** Two-axis classification used by every bench page (badges, row highlights,
 *  variant filtering). Computed once at module load from the catalog. */
export interface AlgoClassification {
  envs: ReadonlyArray<'node' | 'browser'>
  stream: boolean
  compressorFamily: string
}

export function classifyMeta(algo: AlgoMeta | undefined): AlgoClassification {
  return algo
    ? {
        envs: algo.environments,
        stream: algo.binding.streamable,
        compressorFamily: algo.binding.compressor,
      }
    : { envs: [], stream: false, compressorFamily: 'unknown' }
}

export const CLASSIFICATION: Record<string, AlgoClassification> = (() => {
  const out: Record<string, AlgoClassification> = {}

  for (const Ctor of algorithmCatalog.list()) {
    const compressor = Ctor.Compressor as unknown as { familyId?: string }

    out[Ctor.name] = {
      envs: [...Ctor.capabilities.environments],
      stream: Ctor.capabilities.streamable,
      compressorFamily: compressor?.familyId ?? 'unknown',
    }
  }

  return out
})()

/** Look up classification by algo name; returns a safe default when missing
 *  so UI code doesn't need null checks for unknown names. */
export function classify(algoName: string): AlgoClassification {
  return CLASSIFICATION[algoName] ?? { envs: [], stream: false, compressorFamily: 'unknown' }
}
