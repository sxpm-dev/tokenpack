const ALLOW = new Set([
  'content-type',
  'content-encoding',
  'content-language',
  'cache-control',
  'etag',
  'last-modified',
  'expires',
  'vary',
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-expose-headers',
  'cross-origin-resource-policy',
  'sourcemap',
  'x-sourcemap',
  'integrity',
])

export function scrubHeaders(
  input: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {}

  for (const [key, value] of Object.entries(input)) {
    const lower = key.toLowerCase()

    if (ALLOW.has(lower)) {
      out[lower] = value
    }
  }

  return Object.freeze(out)
}
