// FilePack — a token carrying a single anonymous (or named) payload.

import type { DiffPack, DirPack, FilePack as IFilePack, PackEntryInfo } from './types'

export interface FilePackInfo {
  /** Path/name for the single payload — '' for anonymous. */
  name: string
  size: number
}

export class FilePack implements IFilePack {
  readonly list: string[]
  readonly entries: ReadonlyArray<PackEntryInfo>

  constructor(
    info: FilePackInfo,
    private readonly load: () => Promise<Uint8Array>,
  ) {
    this.list = [info.name]
    this.entries = [{ path: info.name, size: info.size }]
  }

  isPack(): this is DirPack {
    return false
  }

  isDiff(): this is DiffPack {
    return false
  }

  async content(): Promise<Uint8Array> {
    return this.load()
  }

  async text(): Promise<string> {
    return new TextDecoder().decode(await this.load())
  }

  async json<T = unknown>(): Promise<T> {
    return JSON.parse(await this.text()) as T
  }

  async blob(): Promise<Blob> {
    const bytes = await this.load()

    // The strictness of `Uint8Array<ArrayBufferLike>` vs `BlobPart` is a TS-only
    // mismatch — at runtime Blob accepts any TypedArray. Narrow via `unknown`.
    return new Blob([bytes as unknown as ArrayBuffer])
  }
}
