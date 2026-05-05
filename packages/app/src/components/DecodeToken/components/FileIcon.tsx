import {
  FileCodeIcon,
  FileCssIcon,
  FileIcon as PhosphorFileIcon,
  FileJsIcon,
  FileTextIcon,
  FileTsIcon,
} from '@phosphor-icons/react'

interface FileIconProps {
  name: string
  className?: string
}

export function FileIcon({ name, className }: FileIconProps) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const base = `shrink-0 ${className ?? ''}`
  const props = { size: 14, weight: 'fill' as const }

  if (['ts', 'tsx'].includes(ext)) {
    return <FileTsIcon {...props} className={`${base} text-blue-400`} />
  }
  if (['js', 'jsx', 'mjs'].includes(ext)) {
    return <FileJsIcon {...props} className={`${base} text-yellow-400`} />
  }
  if (['css', 'scss', 'sass'].includes(ext)) {
    return <FileCssIcon {...props} className={`${base} text-pink-400`} />
  }
  if (['md', 'mdx', 'txt'].includes(ext)) {
    return <FileTextIcon {...props} className={`${base} text-white/50`} />
  }
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) {
    return <FileCodeIcon {...props} className={`${base} text-orange-400`} />
  }
  return <PhosphorFileIcon {...props} className={`${base} text-white/40`} />
}
