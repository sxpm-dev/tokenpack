// Class-based FEC registry. Same shape as compressorRegistry.

import type { OptionsSchema } from '../components/options'
import { NoneFec } from './none-fec'
import { ReedSolomonFec } from './reed-solomon-fec'
import { AbstractFec, type FecMode } from './types'

export interface FecCtor {
  new (...args: never[]): AbstractFec
  optionsSchema: OptionsSchema
  fromOptions?(opts: Record<string, unknown>): AbstractFec
  enumerate?(): AbstractFec[]
}

export class FecRegistry {
  private readonly classes = new Map<string, FecCtor>()

  constructor() {
    this.register('none', NoneFec as unknown as FecCtor)
    this.register('rs', ReedSolomonFec as unknown as FecCtor)
  }

  register(familyId: string, Ctor: FecCtor): void {
    if (this.classes.has(familyId)) return
    this.classes.set(familyId, Ctor)
  }

  byMode(mode: FecMode | string | undefined): AbstractFec {
    if (!mode || mode === 'none') return new NoneFec()
    const dashIdx = mode.lastIndexOf('-')
    const family = dashIdx > 0 ? mode.slice(0, dashIdx) : mode
    const level = dashIdx > 0 ? Number(mode.slice(dashIdx + 1)) : undefined
    const Ctor = this.classes.get(family)

    if (!Ctor) return new NoneFec()
    if (Ctor.fromOptions) return Ctor.fromOptions({ parity: level })

    return new Ctor()
  }

  byHeaderLevel(level: number): AbstractFec {
    for (const inst of this.list()) {
      if (inst.headerLevel === level) return inst
    }

    return new NoneFec()
  }

  /** Flat list of all (family × level) instances — for dashboard / decode iteration. */
  list(): AbstractFec[] {
    const out: AbstractFec[] = []

    for (const Ctor of this.classes.values()) {
      if (Ctor.enumerate) out.push(...Ctor.enumerate())
      else out.push(new Ctor())
    }

    return out
  }

  /** Class-level metadata. */
  listFamilies(): FecCtor[] {
    return [...this.classes.values()]
  }

  listModes(): FecMode[] {
    return this.list().map(f => f.id)
  }
}

export const fecRegistry = new FecRegistry()
