// DirPack — a multi-file pack-format token. Backed by injected extract/extractAll
// functions so this class stays env-neutral.

import type { DiffPack, DirPack as IDirPack, PackEntryInfo } from './types'

export type ExtractOneFn = (path: string) => Promise<Uint8Array>
export type ExtractAllFn = () => Promise<Array<{ path: string; bytes: Uint8Array }>>
export type DiffToFn = (a: IDirPack, b: IDirPack) => Promise<unknown>
export type ApplyDiffFn = (base: IDirPack, diff: DiffPack) => Promise<IDirPack>

export class DirPack implements IDirPack {
  readonly list: string[]
  readonly entries: ReadonlyArray<PackEntryInfo>

  constructor(
    entries: ReadonlyArray<PackEntryInfo>,
    private readonly extractOne: ExtractOneFn,
    private readonly extractAllFn: ExtractAllFn,
    private readonly diffToFn?: DiffToFn,
    private readonly applyDiffFn?: ApplyDiffFn,
  ) {
    this.entries = entries
    this.list = entries.map(e => e.path)
  }

  isPack(): this is IDirPack {
    return true
  }

  isRouter(): this is import('./types').RouterPack {
    return false
  }

  isDiff(): this is DiffPack {
    return false
  }

  async materialize(): Promise<never> {
    throw new Error('DirPack.materialize: not configured (env package must attach runtime support)')
  }

  async extract(path: string): Promise<Uint8Array> {
    if (!this.entries.find(e => e.path === path)) {
      throw new Error(`no entry for path: ${path}`)
    }

    return this.extractOne(path)
  }

  async text(path: string): Promise<string> {
    return new TextDecoder().decode(await this.extract(path))
  }

  async json<T = unknown>(path: string): Promise<T> {
    return JSON.parse(await this.text(path)) as T
  }

  async blob(path: string): Promise<Blob> {
    const bytes = await this.extract(path)

    // The strictness of `Uint8Array<ArrayBufferLike>` vs `BlobPart` is a TS-only
    // mismatch — at runtime Blob accepts any TypedArray. Narrow via `unknown`.
    return new Blob([bytes as unknown as ArrayBuffer])
  }

  async extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>> {
    return this.extractAllFn()
  }

  async diffTo(other: IDirPack): Promise<unknown> {
    if (!this.diffToFn) {
      throw new Error('DirPack.diffTo: not configured (env package must inject diffToFn)')
    }

    return this.diffToFn(this, other)
  }

  async apply(diff: DiffPack): Promise<IDirPack> {
    if (this.applyDiffFn) return this.applyDiffFn(this, diff)

    return diff.apply(this)
  }
}
