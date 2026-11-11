/**
 * Wire-byte accounting via the Resource Timing API.
 *
 * transferSize  — bytes on the wire incl. headers (0 for cache hits and for
 *                 cross-origin responses without Timing-Allow-Origin).
 * encodedBytes  — compressed body bytes.
 * decodedBytes  — decompressed body bytes.
 *
 * Only http(s) entries count: blob:/data: URLs (router materialize output)
 * never touch the network. The navigation entry (the HTML document itself)
 * is included so all variants pay for their own shell.
 *
 * Callers must raise the resource-timing buffer (see benchStartScript in the
 * HTML shells) before assets load — the default 250-entry buffer silently
 * drops entries on the large fixture.
 */

export interface WireBytes {
  requests: number
  transferBytes: number
  encodedBytes: number
  decodedBytes: number
}

export function collectWireBytes(): WireBytes {
  const totals = {
    requests: 0,
    transferBytes: 0,
    encodedBytes: 0,
    decodedBytes: 0,
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

  for (const entry of resources) {
    if (!entry.name.startsWith('http')) continue
    totals.requests += 1
    totals.transferBytes += entry.transferSize
    totals.encodedBytes += entry.encodedBodySize
    totals.decodedBytes += entry.decodedBodySize
  }

  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined

  if (nav) {
    totals.requests += 1
    totals.transferBytes += nav.transferSize
    totals.encodedBytes += nav.encodedBodySize
    totals.decodedBytes += nav.decodedBodySize
  }

  return totals
}

export function diffWireBytes(after: WireBytes, before: WireBytes): WireBytes {
  return {
    requests: after.requests - before.requests,
    transferBytes: after.transferBytes - before.transferBytes,
    encodedBytes: after.encodedBytes - before.encodedBytes,
    decodedBytes: after.decodedBytes - before.decodedBytes,
  }
}
