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
  isPack(): this is DirPack
  isDiff(): this is DiffPack
}

export interface FilePack extends PackBase {
  entries: ReadonlyArray<PackEntryInfo>
  content(): Promise<Uint8Array>
  text(): Promise<string>
  json<T = unknown>(): Promise<T>
  blob(): Promise<Blob>
}

export interface DirPack extends PackBase {
  entries: ReadonlyArray<PackEntryInfo>
  extract(path: string): Promise<Uint8Array>
  text(path: string): Promise<string>
  json<T = unknown>(path: string): Promise<T>
  blob(path: string): Promise<Blob>
  extractAll(): Promise<Array<{ path: string; bytes: Uint8Array }>>
  diffTo(other: DirPack): Promise<unknown>
}

export type DiffOpKind = 'add' | 'modify' | 'patch' | 'delete' | 'rename'

export interface DiffEntry {
  path: string
  op: DiffOpKind
  size?: number
  fromPath?: string
}

export interface DiffPack extends PackBase {
  entries: ReadonlyArray<DiffEntry>
  apply(prev: DirPack): Promise<DirPack>
}

export type Pack = FilePack | DirPack | DiffPack
