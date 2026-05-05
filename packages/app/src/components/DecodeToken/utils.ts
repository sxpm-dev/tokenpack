import type { FileEntry } from '@/app/api/decode/route'
import type { TreeNode } from './types'

export function buildTree(files: FileEntry[]): TreeNode[] {
  const root: TreeNode[] = []
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))

  for (const file of sorted) {
    const parts = file.path.split('/')
    let current = root
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      if (i === parts.length - 1) {
        current.push({ name, path: file.path, type: 'file', children: [], entry: file })
      } else {
        let dir = current.find(n => n.name === name && n.type === 'dir')
        if (!dir) {
          dir = { name, path: parts.slice(0, i + 1).join('/'), type: 'dir', children: [] }
          current.push(dir)
        }
        current = dir.children
      }
    }
  }
  return root
}
