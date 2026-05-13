const API_PATH_RE = /(^|\/)(?:_api|api|graphql)(?:\/|$)/i
const STATIC_JSON_PATH_RE = /\.json(?:\.z)?$/i

/**
 * Static JSON manifests are part of the app's asset graph even though their
 * content type is `application/json`. API/server JSON should stay outside the
 * pack. URL shape is the stable signal here: hashed/versioned asset manifests
 * end in `.json`/`.json.z`, while Wix server APIs normally route through
 * `_api`, `api`, or GraphQL endpoints.
 */
export function isStaticJsonAssetUrl(input: string): boolean {
  let url: URL

  try {
    url = new URL(input)
  } catch {
    return false
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (API_PATH_RE.test(url.pathname)) return false

  return STATIC_JSON_PATH_RE.test(url.pathname)
}
