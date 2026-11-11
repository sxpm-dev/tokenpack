// Inline data URI scenario — browser-side definition.
// Compares parsing/decoding representations already loaded into memory.

import { decode } from '@tokenpack/browser'

import type { RunCtx, ScenarioDef } from '../types'

const explanation = `## What is measured

Decode and parse time for the same customer records, after fixture loading completes.
Network transfer and HTML parsing are excluded. Byte sizes describe the stored representation,
not compressed HTTP transfer. This is a local decode comparison, not a page-load benchmark.

Plain JSON is the baseline. Base64 adds a representation cost for data URIs; it is not
required for ordinary inline JSON. PNG variants represent external image assets, so they
should not be interpreted as equivalent inline HTML delivery. For actual inline delivery
and first-render timing, use the SSR streaming playground.

Brotli variants require browser support for DecompressionStream('br').
`

export const inlineDataUriScenario: ScenarioDef = {
  id: 'inline-data-uri',
  name: 'Inline JSON delivery',
  description:
    'Decode and parse already-loaded JSON, data URI, and PNG representations. Fetch time is excluded.',
  explanation,
  sizes: [10, 100, 1000],
  variants: [
    {
      id: 'raw-json',
      label: 'plain JSON',
      compat: 'full',
      detail: 'Already-loaded UTF-8 JSON → TextDecoder → JSON.parse; no base64 overhead.',
      run: async ctx => {
        const response = await ctx.fetchFixture(`payload-${ctx.size}kb.json`)

        if (!response.ok) throw new Error(`fixture fetch failed: ${response.status}`)
        const bytes = new Uint8Array(await response.arrayBuffer())
        const start = performance.now()

        JSON.parse(new TextDecoder().decode(bytes))

        return {
          totalMs: performance.now() - start,
          wireBytes: bytes.byteLength,
          decodedBytes: bytes,
        }
      },
    },
    {
      id: 'base64-raw',
      label: 'base64 raw JSON',
      compat: 'full',
      detail:
        'Inlined as `data:application/json;base64,<…>`. JS path: `atob` → `TextDecoder.decode` → `JSON.parse`.',
      run: ctx => runBase64Raw(ctx, dataUriFile('raw', ctx.size)),
    },
    {
      id: 'base64-deflate',
      label: 'base64 + deflate',
      compat: 'full',
      detail:
        "Inlined as `data:application/octet-stream;base64,<deflate>`. JS path: `atob` → `DecompressionStream('deflate')` → `TextDecoder` → `JSON.parse`.",
      run: ctx => runBase64Compressed(ctx, dataUriFile('deflate', ctx.size), 'deflate'),
    },
    {
      id: 'base64-br',
      label: 'base64 + brotli',
      compat: 'partial',
      detail:
        "Same shape as `base64-deflate` but with brotli inner. Needs `DecompressionStream('br')`.",
      run: ctx => runBase64Compressed(ctx, dataUriFile('br', ctx.size), 'br'),
    },
    {
      id: 'tokenpack-deflate',
      label: 'tokenpack PNG (deflate-6)',
      compat: 'full',
      detail:
        'Shipped as a raw PNG file (no base64 wrap). JS path: `fetch` → `blob` → `decode(blob)` → `JSON.parse`.',
      run: ctx => runTokenpack(ctx, pngFile('tokenpack-deflate', ctx.size)),
    },
    {
      id: 'tokenpack-brotli',
      label: 'tokenpack PNG (brotli-6)',
      compat: 'partial',
      detail: 'Same as `tokenpack-deflate` but with brotli-6 inner.',
      run: ctx => runTokenpack(ctx, pngFile('tokenpack-brotli', ctx.size)),
    },
  ],
}

function dataUriFile(kind: 'raw' | 'deflate' | 'br', size: number | null): string {
  if (size === null) throw new Error('inline-data-uri: size is required')

  return `payload-${size}kb.${kind}.txt`
}

function pngFile(kind: 'tokenpack-deflate' | 'tokenpack-brotli', size: number | null): string {
  if (size === null) throw new Error('inline-data-uri: size is required')

  return `payload-${size}kb.${kind}.png`
}

async function runBase64Raw(ctx: RunCtx, file: string) {
  const dataURI = await fetchText(ctx, file)
  const t0 = performance.now()
  const b64 = stripDataURIPrefix(dataURI)
  const bytes = base64ToBytes(b64)

  JSON.parse(new TextDecoder().decode(bytes))
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes: dataURI.length, decodedBytes: bytes }
}

async function runBase64Compressed(ctx: RunCtx, file: string, format: 'deflate' | 'br') {
  const dataURI = await fetchText(ctx, file)
  const t0 = performance.now()
  const compressed = base64ToBytes(stripDataURIPrefix(dataURI))
  const stream = new Response(compressed as BodyInit).body!.pipeThrough(
    // TS lib.dom doesn't list 'br'; runtime supports it on modern browsers.
    new (DecompressionStream as unknown as new (f: string) => TransformStream)(format),
  )
  const decompressed = new Uint8Array(await new Response(stream).arrayBuffer())

  JSON.parse(new TextDecoder().decode(decompressed))
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes: dataURI.length, decodedBytes: decompressed }
}

async function runTokenpack(ctx: RunCtx, file: string) {
  const resp = await ctx.fetchFixture(file)

  if (!resp.ok) throw new Error(`fixture fetch failed: ${resp.status}`)
  const blob = await resp.blob()
  const wireBytes = blob.size
  const t0 = performance.now()
  const pack = await decode(blob)

  if (pack.isPack() || pack.isDiff()) {
    throw new Error('expected single-file Pack, got dir/diff')
  }
  const bytes = await pack.content()

  JSON.parse(new TextDecoder().decode(bytes))
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes, decodedBytes: bytes }
}

async function fetchText(ctx: RunCtx, file: string): Promise<string> {
  const r = await ctx.fetchFixture(file)

  if (!r.ok) throw new Error(`fixture fetch failed: ${r.status}`)

  return r.text()
}

function stripDataURIPrefix(dataURI: string): string {
  const comma = dataURI.indexOf(',')

  return comma >= 0 ? dataURI.slice(comma + 1) : dataURI
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)

  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)

  return out
}
