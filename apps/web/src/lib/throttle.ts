// Server-side response throttling — same conditions as
// `apps/web/src/app/api/runtime-benchmark/_shared.ts`. Inlined here so
// the runtime-experiments app stays self-contained (no cross-package import
// for an app-side helper).

export interface NetworkCondition {
  name: 'local' | 'fast-cdn' | 'average' | 'slow'
  latencyMs: number
  bandwidthBps: number
  label: string
}

export const NETWORK_CONDITIONS: readonly NetworkCondition[] = [
  { name: 'local', latencyMs: 0, bandwidthBps: Infinity, label: 'Local · no throttle' },
  {
    name: 'fast-cdn',
    latencyMs: 10,
    bandwidthBps: 100 * 1024 * 1024,
    label: 'Fast CDN · 10ms · 100 MB/s',
  },
  {
    name: 'average',
    latencyMs: 50,
    bandwidthBps: 10 * 1024 * 1024,
    label: 'Average · 50ms · 10 MB/s',
  },
  { name: 'slow', latencyMs: 100, bandwidthBps: 2 * 1024 * 1024, label: 'Slow · 100ms · 2 MB/s' },
] as const

export type ThrottleName = NetworkCondition['name']

export function networkConditionFor(name: string | null | undefined): NetworkCondition {
  return NETWORK_CONDITIONS.find(c => c.name === name) ?? NETWORK_CONDITIONS[0]
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const THROTTLE_CHUNK = 8 * 1024

/**
 * Wrap a fully-buffered response body so it streams paced to the network
 * condition. For `local` (latency=0, bandwidth=Infinity) we short-circuit
 * and return the raw `Uint8Array` so `Response` hands it to the runtime
 * directly — no chunking overhead, byte-for-byte equivalent to a plain
 * `new Response(body)`.
 */

export function throttledBody(body: Uint8Array, condition: NetworkCondition): any {
  const { latencyMs, bandwidthBps } = condition

  if (latencyMs === 0 && !isFinite(bandwidthBps)) {
    return body
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (latencyMs > 0) await sleep(latencyMs)

      let offset = 0

      while (offset < body.byteLength) {
        const end = Math.min(offset + THROTTLE_CHUNK, body.byteLength)
        const chunk = body.subarray(offset, end)

        controller.enqueue(chunk)
        offset = end
        if (isFinite(bandwidthBps) && offset < body.byteLength) {
          await sleep((chunk.byteLength / bandwidthBps) * 1000)
        }
      }
      controller.close()
    },
  })
}
