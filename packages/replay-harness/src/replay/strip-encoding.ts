/**
 * Drop response headers that lie about the body we're about to fulfill.
 *
 * The recorder stores Playwright-DECODED bytes (resp.body() auto-decompresses
 * brotli/gzip). If we replay those bytes with the original `content-encoding`
 * header still attached, the browser tries to decompress already-decompressed
 * bytes → garbage → the script tag fails → the editor's init crashes silently
 * and downstream lazy chunks never get requested. We saw exactly this on Wix:
 * `editor-platform-services/*` were never fetched in TP mode.
 *
 * Also strip `content-length` — it's wrong by definition for our re-encoded
 * body, and Playwright/CDP recomputes it for us.
 */
export function stripWireHeaders(
  headers: Readonly<Record<string, string>>,
): Record<string, string> {
  const out: Record<string, string> = {}

  for (const [name, value] of Object.entries(headers)) {
    const k = name.toLowerCase()

    if (k === 'content-encoding' || k === 'content-length') continue
    out[name] = value
  }

  return out
}
