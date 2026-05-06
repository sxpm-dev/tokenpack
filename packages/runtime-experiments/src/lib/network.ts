// Network throttling for runtime-experiments scenarios.
//
// Wraps `fetch` with an artificial RTT + bandwidth ceiling so scenarios can
// run "as if on slow 3G" without hitting an actual throttled network. Useful
// for demonstrating that streaming-decompression wins are bigger on slow links.

const NETWORK_PROFILES = {
  none: { rttMs: 0, bandwidthBps: Infinity, label: 'No throttle' },
  cable: { rttMs: 10, bandwidthBps: 50_000_000 / 8, label: 'Cable (50Mbps, 10ms)' },
  '4g': { rttMs: 50, bandwidthBps: 10_000_000 / 8, label: '4G (10Mbps, 50ms)' },
  'slow-3g': { rttMs: 400, bandwidthBps: 400_000 / 8, label: 'Slow 3G (400kbps, 400ms)' },
} as const

export type NetworkProfile = keyof typeof NETWORK_PROFILES

export function getProfileLabel(profile: NetworkProfile): string {
  return NETWORK_PROFILES[profile].label
}

export const NETWORK_PROFILE_NAMES = Object.keys(NETWORK_PROFILES) as NetworkProfile[]

/**
 * Wrap a fetch promise with simulated RTT + bandwidth.
 *
 *   const blob = await throttledFetch('/big.png', 'slow-3g').then(r => r.blob())
 */
export async function throttledFetch(
  input: RequestInfo | URL,
  profile: NetworkProfile = 'none',
): Promise<Response> {
  const cfg = NETWORK_PROFILES[profile]

  if (cfg.rttMs > 0) await sleep(cfg.rttMs)
  const response = await fetch(input)

  if (cfg.bandwidthBps === Infinity) return response

  // Throttle the response body.
  const body = response.body

  if (!body) return response

  const reader = body.getReader()
  const throttled = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await reader.read()

      if (done) {
        controller.close()

        return
      }
      const delayMs = (value.byteLength / cfg.bandwidthBps) * 1000

      if (delayMs > 1) await sleep(delayMs)
      controller.enqueue(value)
    },
    cancel(reason) {
      reader.cancel(reason)
    },
  })

  return new Response(throttled, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
