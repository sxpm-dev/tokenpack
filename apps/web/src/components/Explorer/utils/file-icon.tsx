import {
  BracketsCurlyIcon,
  FileCodeIcon,
  FileIcon as DefaultFileIcon,
  FileTextIcon,
  type Icon as PhosphorIcon,
  ImageIcon,
} from '@phosphor-icons/react'

export interface FileIconConfig {
  Icon: PhosphorIcon
  tint: string
}

const TEXT_EXTS = new Set(['md', 'markdown', 'txt', 'log', 'csv', 'tsv', 'env', 'ini'])

const CODE_EXTS = new Set([
  'js',
  'mjs',
  'cjs',
  'jsx',
  'ts',
  'tsx',
  'py',
  'rb',
  'go',
  'rs',
  'swift',
  'java',
  'kt',
  'php',
  'c',
  'cc',
  'cpp',
  'h',
  'hpp',
  'cs',
  'sh',
  'bash',
  'zsh',
  'fish',
  'yml',
  'yaml',
  'toml',
  'xml',
  'html',
  'htm',
  'css',
  'scss',
  'sass',
  'less',
  'sql',
])

const IMAGE_EXTS = new Set([
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'avif',
  'apng',
  'bmp',
  'ico',
  'svg',
])

const JSON_EXTS = new Set(['json', 'jsonl', 'ndjson'])

const TINTS: Record<string, string> = {
  ts: 'text-sky-400',
  tsx: 'text-sky-400',
  js: 'text-amber-300',
  jsx: 'text-amber-300',
  py: 'text-emerald-300',
  go: 'text-cyan-400',
  rs: 'text-orange-300',
  rb: 'text-rose-400',
  swift: 'text-orange-400',
  java: 'text-red-300',
  kt: 'text-violet-400',
  php: 'text-indigo-400',
  c: 'text-blue-300',
  cc: 'text-blue-300',
  cpp: 'text-blue-300',
  h: 'text-blue-300',
  hpp: 'text-blue-300',
  cs: 'text-violet-300',
  html: 'text-orange-400',
  htm: 'text-orange-400',
  css: 'text-pink-400',
  scss: 'text-pink-400',
  sass: 'text-pink-400',
  less: 'text-pink-400',
  json: 'text-amber-200',
  jsonl: 'text-amber-200',
  ndjson: 'text-amber-200',
  yml: 'text-purple-300',
  yaml: 'text-purple-300',
  toml: 'text-purple-300',
  xml: 'text-orange-300',
  md: 'text-slate-200',
  markdown: 'text-slate-200',
  txt: 'text-tp-muted',
  log: 'text-tp-muted',
  csv: 'text-emerald-200',
  tsv: 'text-emerald-200',
  png: 'text-fuchsia-300',
  jpg: 'text-fuchsia-300',
  jpeg: 'text-fuchsia-300',
  webp: 'text-fuchsia-300',
  gif: 'text-fuchsia-300',
  avif: 'text-fuchsia-300',
  apng: 'text-fuchsia-300',
  bmp: 'text-fuchsia-300',
  ico: 'text-fuchsia-300',
  svg: 'text-emerald-300',
  sh: 'text-lime-300',
  bash: 'text-lime-300',
  zsh: 'text-lime-300',
  fish: 'text-lime-300',
  sql: 'text-rose-300',
}

export function getFileIconConfig(filename: string): FileIconConfig {
  const ext = (filename.split('.').pop() ?? '').toLowerCase()
  const tint = TINTS[ext] ?? 'text-tp-muted'

  if (JSON_EXTS.has(ext)) return { Icon: BracketsCurlyIcon, tint }
  if (IMAGE_EXTS.has(ext)) return { Icon: ImageIcon, tint }
  if (CODE_EXTS.has(ext)) return { Icon: FileCodeIcon, tint }
  if (TEXT_EXTS.has(ext)) return { Icon: FileTextIcon, tint }

  return { Icon: DefaultFileIcon, tint }
}

export function leafName(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path ?? 'file'
}
