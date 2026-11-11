// Service Worker / Cache API scenario — browser-side definition.
//
// Each variant seeds the Cache API with its payload on first run, then on
// every iteration measures `cache.match → blob → decode → JSON.parse`. This
// simulates a repeat-visit boot where the browser already has the asset
// cached locally and only the JS-side decode work remains. The seeding step
// is performed inside the runner but excluded from the measured window — we
// only report the warm-cache decode time.

import { decode } from '@tokenpack/browser'

import type { RunCtx, ScenarioDef } from '../types'

const CACHE_NAME = 'tokenpack-web-sw-cache'
const seededRuns = new WeakMap<RunCtx, Set<string>>()

const explanation = `## What's going on

The browser's **Cache API** (the storage primitive Service Workers use)
returns *raw bytes* on read. There's no transparent decompression — your
code is responsible for turning whatever you stored into a usable JS value.

This benchmark asks: *for a payload already living in cache, what's the
fastest path to a JS object?* — measuring the steady-state read path that
fires on every repeat visit / SW-served navigation.

### Variants

| Variant | What's in cache | Read path |
|---|---|---|
| \`raw-json\` | plain JSON bytes | \`cache.match → text → JSON.parse\` |
| \`deflate\` | deflate-compressed bytes | \`cache.match → blob → DecompressionStream('deflate') → text → JSON.parse\` |
| \`brotli\` | brotli-compressed bytes | needs \`DecompressionStream('br')\` |
| \`tokenpack-deflate\` | a PNG that *is* the JSON | \`cache.match → blob → decode(blob) → JSON.parse\` |
| \`tokenpack-brotli\` | same but inner brotli compression | same path, brotli inner |

### Cache seeding

Seeding runs once per (size, variant) on the first iteration. The fixture
fetched from \`/api/fixtures/sw-cache/<file>\` is wrapped in a synthetic
\`Response\` and stored at a deterministic cache key. Subsequent iterations
hit the cache with no network round-trip.

\`\`\`ts
const cache = await caches.open(CACHE_NAME)
await cache.put('/sw-cache/payload-100kb.tokenpack-deflate.png', resp.clone())
// later, on every iteration:
const cached = await cache.match('/sw-cache/payload-100kb.tokenpack-deflate.png')
const blob = await cached!.blob()
const pack = await decode(blob)
\`\`\`
`

export const swCacheScenario: ScenarioDef = {
  id: 'sw-cache',
  name: 'Service Worker / Cache API',
  description:
    'Repeat-visit boot — payload already cached locally. Measures cache.match → JS object ready for each variant.',
  explanation,
  sizes: [10, 100, 1000],
  variants: [
    {
      id: 'raw-json',
      label: 'raw JSON',
      compat: 'full',
      detail:
        'Cache stores plain JSON bytes. Read path: `cache.match` → `Response.text()` → `JSON.parse`.',
      run: ctx => runRaw(ctx, fileFor('raw', ctx.size)),
    },
    {
      id: 'deflate',
      label: 'deflate-compressed',
      compat: 'full',
      detail:
        "Cache stores deflate-compressed bytes. Read path: `cache.match` → `blob()` → `DecompressionStream('deflate')` → `text` → `JSON.parse`.",
      run: ctx => runCompressed(ctx, fileFor('deflate', ctx.size), 'deflate'),
    },
    {
      id: 'brotli',
      label: 'brotli-compressed',
      compat: 'partial',
      detail: "Same shape as `deflate` but with brotli inner. Needs `DecompressionStream('br')`.",
      run: ctx => runCompressed(ctx, fileFor('br', ctx.size), 'br'),
    },
    {
      id: 'tokenpack-deflate',
      label: 'tokenpack PNG (deflate-6)',
      compat: 'full',
      detail:
        "Cache stores the TokenPack PNG. Read path: `cache.match` → `blob()` → `decode(blob)` → `JSON.parse`. Native PNG decoder + codec + `DecompressionStream('deflate')`.",
      run: ctx => runTokenpack(ctx, fileFor('tokenpack-deflate', ctx.size)),
    },
    {
      id: 'tokenpack-brotli',
      label: 'tokenpack PNG (brotli-6)',
      compat: 'partial',
      detail: 'Same as `tokenpack-deflate` but with brotli-6 inner.',
      run: ctx => runTokenpack(ctx, fileFor('tokenpack-brotli', ctx.size)),
    },
  ],
}

function fileFor(kind: string, size: number | null): string {
  if (size === null) throw new Error('sw-cache: size is required')
  if (kind === 'tokenpack-deflate' || kind === 'tokenpack-brotli') {
    return `payload-${size}kb.${kind}.png`
  }

  return `payload-${size}kb.${kind}`
}

async function ensureSeeded(ctx: RunCtx, file: string): Promise<Response> {
  const cache = await caches.open(CACHE_NAME)
  const key = `/sw-cache/${ctx.scenarioId}/${file}`
  const existing = await cache.match(key)

  if (existing && seededRuns.get(ctx)?.has(file)) return existing

  const fetched = await ctx.fetchFixture(file)

  if (!fetched.ok) throw new Error(`fixture fetch failed: ${fetched.status}`)
  // Cache API rejects Vary: *. Store the decoded body with only its content type,
  // and seed once per run so regenerated fixtures replace earlier cached data.
  await cache.put(
    key,
    new Response(await fetched.arrayBuffer(), {
      headers: {
        'content-type': fetched.headers.get('content-type') ?? 'application/octet-stream',
      },
    }),
  )
  const seeded = seededRuns.get(ctx) ?? new Set<string>()

  seeded.add(file)
  seededRuns.set(ctx, seeded)
  const cached = await cache.match(key)

  if (!cached) throw new Error('cache.match returned undefined immediately after put')

  return cached
}

async function runRaw(ctx: RunCtx, file: string) {
  await ensureSeeded(ctx, file)
  const t0 = performance.now()
  const cache = await caches.open(CACHE_NAME)
  const hit = await cache.match(`/sw-cache/${ctx.scenarioId}/${file}`)

  if (!hit) throw new Error('cache miss after seed')
  const text = await hit.text()

  JSON.parse(text)
  const totalMs = performance.now() - t0
  const bytes = new TextEncoder().encode(text)

  return { totalMs, wireBytes: bytes.byteLength, decodedBytes: bytes }
}

async function runCompressed(ctx: RunCtx, file: string, format: 'deflate' | 'br') {
  await ensureSeeded(ctx, file)
  const t0 = performance.now()
  const cache = await caches.open(CACHE_NAME)
  const hit = await cache.match(`/sw-cache/${ctx.scenarioId}/${file}`)

  if (!hit) throw new Error('cache miss after seed')
  const blob = await hit.blob()
  const wireBytes = blob.size
  const stream = blob
    .stream()
    .pipeThrough(new (DecompressionStream as unknown as new (f: string) => TransformStream)(format))
  const decompressed = new Uint8Array(await new Response(stream).arrayBuffer())

  JSON.parse(new TextDecoder().decode(decompressed))
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes, decodedBytes: decompressed }
}

async function runTokenpack(ctx: RunCtx, file: string) {
  await ensureSeeded(ctx, file)
  const t0 = performance.now()
  const cache = await caches.open(CACHE_NAME)
  const hit = await cache.match(`/sw-cache/${ctx.scenarioId}/${file}`)

  if (!hit) throw new Error('cache miss after seed')
  const blob = await hit.blob()
  const wireBytes = blob.size
  const pack = await decode(blob)

  if (pack.isPack() || pack.isDiff()) {
    throw new Error('expected single-file Pack')
  }
  const bytes = await pack.content()

  JSON.parse(new TextDecoder().decode(bytes))
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes, decodedBytes: bytes }
}
