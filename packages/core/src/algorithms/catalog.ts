import type { AbstractCodec } from '../codecs/types'
import { Algorithm } from './algorithm'
import type { AbstractAlgorithm, AlgorithmCatalogEntry } from './types'

export class AlgorithmCatalog {
  private readonly byName = new Map<string, AbstractAlgorithm>()
  private readonly byId = new Map<number, AbstractAlgorithm>()

  register(algorithm: AbstractAlgorithm): void {
    this.byName.set(algorithm.name, algorithm)
    if (!this.byId.has(algorithm.id)) this.byId.set(algorithm.id, algorithm)
  }

  registerCodec(codec: AbstractCodec): AbstractAlgorithm {
    const algorithm = new Algorithm({ codec })

    this.register(algorithm)

    return algorithm
  }

  registerCodecs(codecs: readonly AbstractCodec[]): void {
    for (const codec of codecs) this.registerCodec(codec)
  }

  getByName(name: string): AbstractAlgorithm {
    const algorithm = this.byName.get(name)

    if (!algorithm) throw new Error(`Unknown algorithm: "${name}"`)

    return algorithm
  }

  getById(id: number): AbstractAlgorithm {
    const algorithm = this.byId.get(id)

    if (!algorithm) throw new Error(`Unknown algorithm id: ${id}`)

    return algorithm
  }

  getCodecByName(name: string): AbstractCodec {
    return this.getByName(name).codec
  }

  getCodecById(id: number): AbstractCodec {
    return this.getById(id).codec
  }

  list(): AbstractAlgorithm[] {
    return [...this.byName.values()]
  }

  listEntries(): AlgorithmCatalogEntry[] {
    return this.list().map(algorithm => algorithm.toCatalogEntry())
  }

  clear(): void {
    this.byName.clear()
    this.byId.clear()
  }
}

export const algorithmCatalog = new AlgorithmCatalog()
