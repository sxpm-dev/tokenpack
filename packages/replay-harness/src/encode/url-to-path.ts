import { createHash } from 'node:crypto'

const UNSAFE = /[^a-zA-Z0-9._\-/]/g

export function urlToInternalPath(input: string): string {
  const url = new URL(input)
  const hostPart = url.port ? `${url.host.replace(`:${url.port}`, '')}_${url.port}` : url.host
  const rawPath = url.pathname === '' || url.pathname === '/' ? '/_root' : url.pathname
  // Collapse multiple slashes — PackBuilder.build()'s normalize step does the
  // same. If we don't match, the manifest stores `a//b.js` but the pack stores
  // `a/b.js` and lookups miss. Real Wix CDN paths have `//` in some routes.
  const path = rawPath.replace(/\/+/g, '/')
  const safePath = path.replace(UNSAFE, c => '_' + c.charCodeAt(0).toString(16))

  if (url.search === '') {
    return `${hostPart}${safePath}`
  }

  const queryHash = createHash('sha256').update(url.search).digest('hex').slice(0, 8)
  const lastSlash = safePath.lastIndexOf('/')
  const dot = safePath.lastIndexOf('.')
  const insertAt = dot > lastSlash ? dot : safePath.length

  return `${hostPart}${safePath.slice(0, insertAt)}.${queryHash}${safePath.slice(insertAt)}`
}
