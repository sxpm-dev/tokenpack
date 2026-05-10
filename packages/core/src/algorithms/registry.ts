// Lookup helpers around an environment-owned algorithm catalog.

import type { AlgorithmCatalog } from './catalog'
import type { AlgorithmCtor } from './types'

export function getAlgorithmByName(catalog: AlgorithmCatalog, name: string): AlgorithmCtor {
  return catalog.getByName(name)
}

export function getAlgorithmById(catalog: AlgorithmCatalog, id: number): AlgorithmCtor {
  return catalog.getById(id)
}

export function listAlgorithms(catalog: AlgorithmCatalog): AlgorithmCtor[] {
  return catalog.list()
}
