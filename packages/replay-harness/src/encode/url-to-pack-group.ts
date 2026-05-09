/**
 * Derive a pack-group key from a URL. Files sharing the same host + directory
 * are grouped into the same pack — this matches how real microfrontends ship,
 * where each service builds its own bundle from its own CI.
 *
 *   https://cdn.x.com/services/editor/1.0.0/main.js  →  cdn.x.com--services-editor-1.0.0
 *   https://cdn.x.com/services/editor/1.0.0/runtime.js  → same key
 *   https://cdn.x.com/services/platform/1.2.1/api.js  →  cdn.x.com--services-platform-1.2.1
 *
 * Output is filesystem-safe: lowercase, only [a-z0-9._-].
 */
export function urlToPackGroup(input: string): string {
  const url = new URL(input)
  const hostPart = url.port
    ? `${url.host.replace(`:${url.port}`, '')}_${url.port}`
    : url.host

  // Strip the filename (last segment), keeping the directory path.
  const dir = url.pathname.replace(/\/[^/]*$/, '')
  const trimmed = dir.replace(/^\/+/, '').replace(/\/+$/, '')
  if (trimmed === '') return hostPart.toLowerCase()

  const dirPart = trimmed.replace(/[^a-zA-Z0-9._-]+/g, '-')
  return `${hostPart}--${dirPart}`.toLowerCase()
}
