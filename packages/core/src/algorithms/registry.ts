// Lookup helpers around the algorithm catalog.
// Direct catalog access lives in `./catalog`; this module just exposes the
// most-used queries with concise names.

import { algorithmCatalog } from './catalog'
import type { AlgorithmCtor } from './types'

export function getAlgorithmByName(name: string): AlgorithmCtor {
  return algorithmCatalog.getByName(name)
}

export function getAlgorithmById(id: number): AlgorithmCtor {
  return algorithmCatalog.getById(id)
}

export function listAlgorithms(): AlgorithmCtor[] {
  return algorithmCatalog.list()
}
