// Algorithm catalog — stores algorithm Ctors keyed by id and name.
//
// Consumers `getById(id)` / `getByName(name)` to retrieve a Ctor, then
// `new Ctor(opts)` to construct an instance. The catalog itself never
// instantiates algorithms.

import { isCompactToken, readCompactHeader, readHeader } from '../header'
import { surfaceRegistry } from '../surfaces/registry'

import type { AbstractAlgorithm, AlgorithmCtor } from './types'

export class AlgorithmCatalog {
  private readonly byName = new Map<string, AlgorithmCtor>()
  private readonly byId = new Map<number, AlgorithmCtor>()

  /** Register an algorithm Ctor. Idempotent on duplicate name. */
  register<T extends AbstractAlgorithm>(Ctor: AlgorithmCtor<T>): void {
    if (this.byName.has(Ctor.name)) return
    this.byName.set(Ctor.name, Ctor as AlgorithmCtor)
    if (!this.byId.has(Ctor.id)) this.byId.set(Ctor.id, Ctor as AlgorithmCtor)
  }

  getByName(name: string): AlgorithmCtor {
    const Ctor = this.byName.get(name)

    if (!Ctor) throw new Error(`Unknown algorithm: "${name}"`)

    return Ctor
  }

  getById(id: number): AlgorithmCtor {
    const Ctor = this.byId.get(id)

    if (!Ctor) throw new Error(`Unknown algorithm id: ${id}`)

    return Ctor
  }

  list(): AlgorithmCtor[] {
    return [...this.byName.values()]
  }

  /**
   * Resolve which algorithm should handle a given artifact buffer.
   * Strategy:
   *   1. Per-algorithm canHandle (cheap byte-level sniff for plugins).
   *   2. Surface-decode pixels and read pixel header for codec id.
   *   3. Throw.
   */
  async detectFromBuffer(buffer: Buffer, ext?: string): Promise<AlgorithmCtor> {
    for (const Ctor of this.byName.values()) {
      try {
        // Construct a probe instance to call canHandle (instance method).
        const probe = new Ctor()

        if (probe.canHandle(buffer, ext)) return Ctor
      } catch {
        // ignore — keep iterating
      }
    }

    if (buffer && buffer.length > 8) {
      // Try every non-streaming surface that matches the extension. PNG has
      // multiple readers registered (pngjs/sharp + upng-js); a 4-channel
      // upng-encoded buffer can produce mangled pixels through pngjs (alpha
      // premultiplication) but read byte-exact through upng-js. We accept the
      // first reader whose pixel header maps to a known algo id.
      const candidates = surfaceRegistry.listForExtension(ext ?? '.png')
      const surfaces = candidates.length > 0 ? candidates : [surfaceRegistry.byExtension(ext ?? '.png')]

      for (const surface of surfaces) {
        try {
          const image = await surface.readBuffer(buffer)
          const id = isCompactToken(image.pixels)
            ? readCompactHeader(image.pixels).algoId
            : readHeader(image.pixels).algorithmId
          const Ctor = this.byId.get(id)

          if (Ctor) return Ctor
        } catch {
          // surface couldn't decode or header was garbage — try the next one
        }
      }
    }

    throw new Error('no algorithm matched the provided artifact buffer')
  }

  clear(): void {
    this.byName.clear()
    this.byId.clear()
  }
}

export const algorithmCatalog = new AlgorithmCatalog()
