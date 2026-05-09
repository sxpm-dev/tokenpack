// Live view of algorithm metadata for the dashboard's algorithms page.
// Reads `algorithmCatalog.list()` at module evaluation; importing
// `@tokenpack/browser` populates the catalog as a side effect.

import '@tokenpack/browser'

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { type AlgorithmInfo, buildAlgorithmInfoFromCtor } from 'tokenpack/algorithms/catalog-info'

export type AlgoMeta = AlgorithmInfo

export const ALGO_CATALOG: AlgoMeta[] = algorithmCatalog.list().map(buildAlgorithmInfoFromCtor)

/** Two-axis classification used by every bench page (badges, row highlights,
 *  variant filtering). Computed once at module load from the catalog. */
export interface AlgoClassification {
  envs: ReadonlyArray<'node' | 'browser'>
  stream: boolean
  compressorFamily: string
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
