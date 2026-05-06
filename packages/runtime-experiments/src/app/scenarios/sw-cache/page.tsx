'use client'

import { Button } from '@heroui/react'
import { ArrowLeftIcon, BroomIcon } from '@phosphor-icons/react'
import { decode, encode } from '@tokenpack/browser'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { ScenarioRunner, type Variant } from '@/components/ScenarioRunner'
import { generatePayload } from '@/lib/payloads'

const CACHE_NAME = 'tokenpack-runtime-experiments-sw-cache'
const TOKEN_KEY = '/cached/payload.tpk'
const BROTLI_KEY = '/cached/payload.br'
const RAW_KEY = '/cached/payload.raw.json'

export default function SwCachePage() {
  const [size, setSize] = useState<10 | 100 | 1000>(100)
  const [variants, setVariants] = useState<Variant[] | null>(null)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    let cancelled = false

    // Reset to "seeding…" UI as soon as `size` changes. The `react-hooks/
    // set-state-in-effect` rule flags this — and is right that for derivable
    // state you should use useMemo. Here the rebuild is async (it talks to
    // Cache API), so we genuinely need to flash a loading UI between size
    // changes; deriving from `variants` against current `size` would be racy.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVariants(null)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeeded(false)
    ;(async () => {
      const built = await build(size)

      if (cancelled) return
      setVariants(built)
      setSeeded(true)
    })()

    return () => {
      cancelled = true
    }
  }, [size])

  async function clearCache() {
    if ('caches' in self) {
      await caches.delete(CACHE_NAME)
    }
    setSeeded(false)
    setVariants(null)
    const built = await build(size)

    setVariants(built)
    setSeeded(true)
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link
        className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-6"
        href="/"
      >
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <h1 className="text-xl font-semibold tracking-tight">Service Worker / Cache API</h1>
      <p className="mt-1 text-sm text-white/45 leading-relaxed">
        Each variant stores its payload in the browser&apos;s Cache API (the same storage Service
        Workers use) and measures the cost of{' '}
        <span className="text-white/70">cache.match → JS object ready</span>. TokenPack rides the
        browser&apos;s native PNG decoder. Brotli/raw are JS-side.
      </p>

      <div className="my-6 flex items-center gap-3 text-xs">
        <span className="text-white/40 mr-2">Payload size:</span>
        {([10, 100, 1000] as const).map(s => (
          <Button
            key={s}
            size="sm"
            variant={size === s ? 'primary' : 'ghost'}
            onPress={() => setSize(s)}
          >
            {s}KB
          </Button>
        ))}
        <Button size="sm" variant="ghost" onPress={clearCache}>
          <BroomIcon className="mr-1" size={12} /> Clear cache
        </Button>
      </div>

      {!variants ? (
        <div className="text-white/30 text-sm py-6 animate-pulse">Seeding cache for {size}KB…</div>
      ) : (
        <>
          {seeded && (
            <div className="mb-3 text-xs text-green-400">
              Cache seeded. Each iteration runs <code>cache.match()</code> (warm read) + decode.
            </div>
          )}
          <ScenarioRunner defaultIterations={20} variants={variants} />
        </>
      )}

      <details className="mt-8 text-xs text-white/40">
        <summary className="cursor-pointer hover:text-white/60">Methodology</summary>
        <ul className="mt-3 space-y-2 list-disc list-inside leading-relaxed">
          <li>
            Each variant seeds its payload into{' '}
            <code>{`caches.open('${CACHE_NAME}')`}</code> on mount.
          </li>
          <li>
            Iteration loop: <code>cache.match(key)</code> → <code>response.blob()</code> → decode →
            JS object.
          </li>
          <li>
            <strong>TokenPack:</strong> Blob → <code>createImageBitmap</code> → canvas → core decode
            → JSON.parse.
          </li>
          <li>
            <strong>Brotli:</strong> Blob → <code>DecompressionStream(&apos;br&apos;)</code> →
            text → JSON.parse. Skipped if browser lacks brotli.
          </li>
          <li>
            <strong>Raw JSON:</strong> Blob → text → JSON.parse. Baseline; no compression cost.
          </li>
          <li>
            The cache hit is warm for all iterations after the first; &quot;Clear cache&quot;
            forces a re-seed.
          </li>
        </ul>
      </details>
    </main>
  )
}

async function seedCache(
  jsonString: string,
): Promise<{ tokenBytes: number; brotliBytes: number | null; rawBytes: number }> {
  const cache = await caches.open(CACHE_NAME)

  // 1. Raw JSON
  const rawBlob = new Blob([jsonString], { type: 'application/json' })

  await cache.put(RAW_KEY, new Response(rawBlob))

  // 2. Brotli (if supported)
  let brotliBytes: number | null = null

  try {
    const cs = new CompressionStream('br' as CompressionFormat)
    const stream = new Response(rawBlob).body!.pipeThrough(cs)
    const compressed = await new Response(stream).blob()

    brotliBytes = compressed.size
    await cache.put(BROTLI_KEY, new Response(compressed))
  } catch {
    /* brotli unsupported */
  }

  // 3. TokenPack PNG
  const { blobs } = await encode(jsonString, { algo: 'linear', compressionMode: 'brotli-6' })

  await cache.put(TOKEN_KEY, new Response(blobs[0]))

  return { tokenBytes: blobs[0].size, brotliBytes, rawBytes: rawBlob.size }
}

async function build(sizeKB: 10 | 100 | 1000): Promise<Variant[]> {
  const json = JSON.stringify(generatePayload(sizeKB))
  const sizes = await seedCache(json)

  const cache = await caches.open(CACHE_NAME)

  const variants: Variant[] = [
    {
      label: 'Raw JSON (cache.match → text → JSON.parse)',
      run: async () => {
        const t0 = performance.now()
        const response = await cache.match(RAW_KEY)

        if (!response) throw new Error('cache miss')
        const text = await response.text()

        JSON.parse(text)

        return { ms: performance.now() - t0, bytes: sizes.rawBytes }
      },
    },
  ]

  if (sizes.brotliBytes !== null) {
    variants.push({
      label: 'Brotli (cache.match → DecompressionStream → JSON.parse)',
      run: async () => {
        const t0 = performance.now()
        const response = await cache.match(BROTLI_KEY)

        if (!response) throw new Error('cache miss')
        const stream = response.body!.pipeThrough(
          new DecompressionStream('br' as CompressionFormat),
        )
        const text = await new Response(stream).text()

        JSON.parse(text)

        return { ms: performance.now() - t0, bytes: sizes.brotliBytes! }
      },
    })
  } else {
    variants.push({
      label: 'Brotli (UNSUPPORTED — no DecompressionStream("br"))',
      run: async () => ({ ms: 0, bytes: 0 }),
    })
  }

  variants.push({
    label: 'TokenPack PNG (cache.match → createImageBitmap → decode → JSON.parse)',
    run: async () => {
      const t0 = performance.now()
      const response = await cache.match(TOKEN_KEY)

      if (!response) throw new Error('cache miss')
      const blob = await response.blob()
      const result = await decode(blob)

      if (result.type !== 'file') throw new Error('expected file token')
      JSON.parse(new TextDecoder().decode(result.payload))

      return { ms: performance.now() - t0, bytes: sizes.tokenBytes }
    },
  })

  return variants
}
