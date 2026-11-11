export type EntryKind = 'text' | 'file'

export interface BuilderEntryBase {
  id: string
  path: string
  kind: EntryKind
}

export interface TextEntry extends BuilderEntryBase {
  kind: 'text'
  text: string
}

export interface FileEntry extends BuilderEntryBase {
  kind: 'file'
  file: File
}

export type BuilderEntry = TextEntry | FileEntry

export interface BuildResult {
  /** PNG (or WebP/AVIF) bytes ready to download or pipe to Explorer. */
  bytes: Uint8Array
  objectURL: string
  fileName: string
  /** True when produced via server route (BE-only algo). */
  fromServer: boolean
  inputBytes: number
  gzipBytes: number | null
  brotliBytes: number | null
}
