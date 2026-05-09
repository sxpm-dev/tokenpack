// Live view of algorithm metadata for the dashboard's algorithms page.
// Reads `algorithmCatalog.list()` at module evaluation; importing
// `@tokenpack/browser` populates the catalog as a side effect.

import '@tokenpack/browser'

import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import { type AlgorithmInfo, buildAlgorithmInfoFromCtor } from 'tokenpack/algorithms/catalog-info'

export type AlgoMeta = AlgorithmInfo

export const ALGO_CATALOG: AlgoMeta[] = algorithmCatalog.list().map(buildAlgorithmInfoFromCtor)
