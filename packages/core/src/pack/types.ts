// Public Pack type contract — discriminated union returned by env-package
// `decode()`. Concrete classes live alongside in this directory.
//
// `entries` shape varies by subclass: file/dir use `PackEntryInfo` with size;
// diff uses richer `DiffEntry`. Keeping `entries` declarations on the leaves
// avoids forcing a union/widening on the base interface.

export interface PackEntryInfo {
  path: string
  size: number
}

export interface PackBase {
  list: string[]
  isRouter(): this is RouterPack
  isPack(): this is DirPack
  isDiff(): this is DiffPack
  materialize(path?: string | string[]): Promise<unknown>
}

export interface FilePack extends PackBase {
  list: string[]
  entries: ReadonlyArray<PackEntryInfo>
  content(): Promise<Uint8Array>
  text(): Promise<string>
  json<T = unknown>(): Promise<T>
  blob(): Promise<Blob>
}

export interface DirPack extends PackBase {
  list: string[]
  entries: ReadonlyArray<PackEntryInfo>
  extract(path: string): Promise<Uint8Array>
  text(path: string): Promise<string>
  json<T = unknown>(path: string): Promise<T>
  blob(path: string): Promise<Blob>
  extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>>
  diffTo(other: DirPack): Promise<unknown>
  apply(diff: DiffPack): Promise<DirPack>
}

export type DiffOpKind = 'add' | 'modify' | 'patch' | 'delete' | 'rename'

export interface DiffEntry {
  path: string
  op: DiffOpKind
  size?: number
  fromPath?: string
}

export interface DiffPack extends PackBase {
  list: string[]
  entries: ReadonlyArray<DiffEntry>
  /** @deprecated Prefer `basePack.apply(diffPack)` so the base owns application. */
  apply(prev: DirPack): Promise<DirPack>
}

export interface RouterPack extends PackBase {
  list: string[] & (() => Promise<unknown[]>)
  entries: ReadonlyArray<PackEntryInfo>
  manifest(): Promise<unknown>
  plan(path?: string | string[]): Promise<unknown>
  content(): Promise<Uint8Array>
  extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>>
  text(): Promise<string>
  text(path: string): Promise<string>
  text(path: string[]): Promise<Map<string, string>>
  json<T = unknown>(path?: string): Promise<T>
  blob(): Promise<Blob>
  blob(path: string): Promise<Blob>
  blob(path: string[]): Promise<Map<string, Blob>>
  materialize(path?: string | string[]): Promise<unknown>
  stream: {
    text(): Promise<string>
    text(path: string): Promise<string>
    text(path: string[]): Promise<Map<string, string>>
    blob(): Promise<Blob>
    blob(path: string): Promise<Blob>
    blob(path: string[]): Promise<Map<string, Blob>>
    extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>>
    materialize(path?: string | string[]): Promise<unknown>
  }
}

export type Pack = FilePack | DirPack | DiffPack | RouterPack
