/** Prefix static assets and ordinary anchors; Next Link handles its own basePath. */
export function sitePath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

  return base && (path === base || path.startsWith(`${base}/`)) ? path : `${base}${path}`
}

export const isStaticSite = process.env.NEXT_PUBLIC_STATIC_SITE === 'true'
