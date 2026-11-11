// Class-based compressor registry. Each registered entry is a compressor CLASS
// (e.g. `NoneCompressor`, `BrotliCompressor`, `DeflateCompressor`); levels are
// per-instance options derived from the class's `optionsSchema`.
//
// Lookup helpers:
//   - byMode('brotli-11')   — parse family + level, instantiate via Ctor.fromOptions
//   - byFamily('brotli')    — return the registered Ctor for a family
//   - byHeaderLevel(n)      — iterate level options across families to find the match
//   - list()                — flat list of all (family × level) instances
//   - listFamilies()        — Ctors only (for class-level metadata in dashboard)

import type { OptionsSchema } from '../components/options'
import { NoneCompressor } from './none-compressor'
import { AbstractCompressor, type CompressionMode } from './types'

export interface CompressorCtor {
  new (...args: never[]): AbstractCompressor
  optionsSchema: OptionsSchema
  familyId: string
  fromOptions?(opts: Record<string, unknown>): AbstractCompressor
}

function levelValues(Ctor: CompressorCtor): readonly number[] {
  const levelOpt = Ctor.optionsSchema?.level

  if (!levelOpt || !levelOpt.values) return []

  return levelOpt.values as readonly number[]
}

function instantiate(Ctor: CompressorCtor, level?: number): AbstractCompressor {
  if (Ctor.fromOptions) return Ctor.fromOptions(level !== undefined ? { level } : {})

  return new Ctor()
}

export class CompressorRegistry {
  private readonly classes = new Map<string, CompressorCtor>()

  constructor() {
    this.register(NoneCompressor as unknown as CompressorCtor)
  }

  /** Register a compressor class. Idempotent on duplicate family. */
  register(Ctor: CompressorCtor): void {
    if (this.classes.has(Ctor.familyId)) return
    this.classes.set(Ctor.familyId, Ctor)
  }

  has(mode: CompressionMode | string | undefined): boolean {
    if (!mode || mode === 'none') return true
    const dashIdx = mode.lastIndexOf('-')

    if (dashIdx <= 0) return this.classes.has(mode)
    const familyId = mode.slice(0, dashIdx)
    const level = Number(mode.slice(dashIdx + 1))
    const Ctor = this.classes.get(familyId)

    if (!Ctor) return false

    return levelValues(Ctor).includes(level)
  }

  byMode(mode: CompressionMode | string | undefined): AbstractCompressor {
    if (!mode || mode === 'none') return new NoneCompressor()
    const dashIdx = mode.lastIndexOf('-')

    if (dashIdx <= 0) {
      const Ctor = this.classes.get(mode)

      return Ctor ? instantiate(Ctor) : new NoneCompressor()
    }
    const familyId = mode.slice(0, dashIdx)
    const level = Number(mode.slice(dashIdx + 1))
    const Ctor = this.classes.get(familyId)

    if (!Ctor) return new NoneCompressor()

    return instantiate(Ctor, level)
  }

  byHeaderLevel(level: number): AbstractCompressor {
    for (const Ctor of this.classes.values()) {
      const levels = levelValues(Ctor)

      if (levels.length === 0) {
        const probe = instantiate(Ctor)

        if (probe.headerLevel === level) return probe
        continue
      }
      for (const lv of levels) {
        const inst = instantiate(Ctor, lv)

        if (inst.headerLevel === level) return inst
      }
    }

    return new NoneCompressor()
  }

  /** All concrete instances expanded across (family × level). */
  list(): AbstractCompressor[] {
    const out: AbstractCompressor[] = []

    for (const Ctor of this.classes.values()) {
      const levels = levelValues(Ctor)

      if (levels.length === 0) {
        out.push(instantiate(Ctor))
        continue
      }
      for (const lv of levels) out.push(instantiate(Ctor, lv))
    }

    return out
  }

  /** Class-level metadata: one Ctor per family. Use for dashboard option rendering. */
  listFamilies(): CompressorCtor[] {
    return [...this.classes.values()]
  }

  listModes(): string[] {
    return this.list().map(c => c.id)
  }
}

export const compressorRegistry = new CompressorRegistry()
