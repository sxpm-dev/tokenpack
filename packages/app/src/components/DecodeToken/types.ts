import type { FileEntry } from '@/app/api/decode/route'

export type DecodeResult =
  | { type: 'text'; content: string }
  | { type: 'filesystem'; files: FileEntry[] }
  | { type: 'binary'; size: number }

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children: TreeNode[]
  entry?: FileEntry
}
