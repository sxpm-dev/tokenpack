import { algorithmCatalog } from './catalog'
import type { AbstractAlgorithm, AlgorithmCatalogEntry } from './types'

export { AlgorithmCatalog, algorithmCatalog } from './catalog'

export function registerAlgorithm(algorithm: AbstractAlgorithm): void {
  algorithmCatalog.register(algorithm)
}

export function getAlgorithmByName(name: string): AbstractAlgorithm {
  return algorithmCatalog.getByName(name)
}

export function getAlgorithmById(id: number): AbstractAlgorithm {
  return algorithmCatalog.getById(id)
}

export function listAlgorithms(): AbstractAlgorithm[] {
  return algorithmCatalog.list()
}

export function listAlgorithmCatalog(): AlgorithmCatalogEntry[] {
  return algorithmCatalog.listEntries()
}
