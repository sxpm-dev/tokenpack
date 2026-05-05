import { FEC_MODE_INFOS } from './modes'
import { NoneFec } from './none-fec'
import { ReedSolomonFec } from './reed-solomon-fec'
import { AbstractFec, type FecMode } from './types'

export class FecRegistry {
  private readonly factories = new Map<FecMode, () => AbstractFec>()

  constructor() {
    for (const info of FEC_MODE_INFOS) {
      if (info.id === 'none') {
        this.register(info.id, () => new NoneFec())
      } else {
        const captured = info

        this.register(
          info.id,
          () =>
            new ReedSolomonFec({
              id: captured.id,
              label: captured.label,
              headerLevel: captured.headerLevel,
              parityBytes: captured.parityBytes,
            }),
        )
      }
    }
  }

  register(mode: FecMode, factory: () => AbstractFec): void {
    this.factories.set(mode, factory)
  }

  byMode(mode: FecMode | string | undefined): AbstractFec {
    const factory = this.factories.get((mode ?? 'none') as FecMode)

    if (!factory) return new NoneFec()

    return factory()
  }

  byHeaderLevel(level: number): AbstractFec {
    for (const [, factory] of this.factories) {
      const fec = factory()

      if (fec.headerLevel === level) return fec
    }

    return new NoneFec()
  }

  list(): AbstractFec[] {
    return [...this.factories.values()].map(f => f())
  }

  listModes(): FecMode[] {
    return [...this.factories.keys()]
  }
}

export const fecRegistry = new FecRegistry()
