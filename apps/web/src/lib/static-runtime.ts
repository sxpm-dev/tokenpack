import { isStaticSite, sitePath } from './site-path'
let files: Record<string, string> = {}

export function setStaticRuntimeFiles(value: Record<string, string>) {
  files = value
}
export function runtimeFixtureUrl(value: string): string {
  if (!isStaticSite) return value
  const url = new URL(value, 'https://fixtures.invalid')
  const p = url.searchParams
  const router = url.pathname.match(/\/router\/(content|script)\/([^/]+)\/router.png$/)
  const endpoint = url.pathname.split('/').pop()
  const tab = router?.[1] ?? p.get('tab') ?? (endpoint?.startsWith('script') ? 'script' : 'content')
  const source = router?.[2] ?? p.get('source') ?? ''
  const strategy = source.replace(/__chunk-\d+$/, '')
  const kind = router
    ? 'router'
    : endpoint === 'range-pack'
      ? 'range-pack'
      : endpoint?.endsWith('token')
        ? 'token'
        : 'native'
  const chunk = kind === 'native' || kind === 'token' ? (p.get('chunk') ?? '0') : '0'
  const key = `${tab}:${strategy}:${kind}:${chunk}:${kind === 'token' ? (p.get('algo') ?? '') : kind === 'native' ? '' : 'pixel-range-none'}:${kind === 'token' ? (p.get('ch') ?? '') : ''}`
  const file = files[key]

  if (!file) throw new Error(`Static fixture unavailable: ${key}`)

  return (
    sitePath(`/runtime-fixtures/${file}`) +
    (p.has('nonce') ? `?nonce=${encodeURIComponent(p.get('nonce')!)}` : '')
  )
}
