export type PreviewKind = 'text' | 'json' | 'image' | 'binary'

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'js',
  'mjs',
  'cjs',
  'jsx',
  'ts',
  'tsx',
  'css',
  'scss',
  'sass',
  'less',
  'html',
  'htm',
  'xml',
  'svg',
  'yaml',
  'yml',
  'toml',
  'ini',
  'env',
  'sh',
  'bash',
  'zsh',
  'fish',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'swift',
  'php',
  'c',
  'cc',
  'cpp',
  'h',
  'hpp',
  'log',
  'csv',
  'tsv',
])

const JSON_EXTENSIONS = new Set(['json', 'jsonl', 'ndjson'])

const IMAGE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'avif',
  'apng',
  'bmp',
  'ico',
])

export function previewKindFor(path: string): PreviewKind {
  const ext = extensionFor(path)

  if (!ext) return 'text'
  if (JSON_EXTENSIONS.has(ext)) return 'json'
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (ext === 'svg') return 'text'
  if (TEXT_EXTENSIONS.has(ext)) return 'text'

  return 'binary'
}

export function imageMimeFor(path: string): string {
  const ext = extensionFor(path)

  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'avif':
      return 'image/avif'
    case 'apng':
      return 'image/apng'
    case 'bmp':
      return 'image/bmp'
    case 'ico':
      return 'image/x-icon'
    default:
      return 'application/octet-stream'
  }
}

function extensionFor(path: string): string {
  const tail = path.split('/').pop() ?? path
  const dot = tail.lastIndexOf('.')

  if (dot < 0 || dot === tail.length - 1) return ''

  return tail.slice(dot + 1).toLowerCase()
}
