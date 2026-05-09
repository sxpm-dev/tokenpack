// Inline data URI scenario — browser-side definition.
//
// Each variant uses its **natural delivery form**:
//
//   • base64-* variants ship a base64 data URI string (the only honest form
//     for embedding binary in HTML/CSS/JS).
//   • tokenpack-* variants ship the raw PNG file. Wrapping the PNG in another
//     base64 layer would be a strawman tax that doesn't match how anyone
//     actually delivers TokenPack assets.
//
// Both groups end the same way: "JS object ready". The headline metric is
// the cheapest path from "served asset → parsed JSON".

import { decode } from '@tokenpack/browser'

import type { RunCtx, ScenarioDef } from '../types'

const explanation = `## What's going on

The challenge: ship a JSON payload as part of an HTML/CSS/JS bootstrap.

For **plain or compressed JSON** the only honest inline form is a data URI —
the browser does no transparent decompression for inlined data, and binary
must be base64-encoded. JS-side decode is mandatory.

For **TokenPack** the natural form is just a PNG file. The browser decodes
the image off-thread; the codec only reads pixels and decompresses inner
bytes. No base64 wrapping needed.

This benchmark asks: *what's the fastest way to bootstrap a JSON payload?*

### Variants

| Variant | Wire form | Decode path |
|---|---|---|
| \`base64-raw\` | base64 data URI of plain JSON | \`atob\` → \`JSON.parse\` |
| \`base64-deflate\` | base64 data URI of deflate(JSON) | \`atob\` → \`DecompressionStream('deflate')\` → \`JSON.parse\` |
| \`base64-br\` | base64 data URI of brotli(JSON) | \`atob\` → \`DecompressionStream('br')\` → \`JSON.parse\` |
| \`tokenpack-deflate\` | raw PNG file | \`decode(blob)\` → image decode + codec + deflate → \`JSON.parse\` |
| \`tokenpack-brotli\` | raw PNG file | same as deflate, brotli inner |

### TokenPack decode pipeline

\`\`\`ts
const blob = await (await fetch('/asset.png')).blob()
const pack = await decode(blob)            // image decode + codec + decompress
const obj  = JSON.parse(new TextDecoder().decode(await pack.content()))
\`\`\`

### Brotli-in-JS pipeline

\`\`\`ts
const compressed = base64ToBytes(stripDataURIPrefix(dataURI))
const stream = new Response(compressed).body!
  .pipeThrough(new DecompressionStream('br'))
const text = await new Response(stream).text()
const obj  = JSON.parse(text)
\`\`\`
`

export const inlineDataUriScenario: ScenarioDef = {
  id: 'inline-data-uri',
  name: 'Inline JSON delivery',
  description:
    'Compares base64 data URIs (plain / deflate / brotli) against raw TokenPack PNG delivery. Headline metric: served asset → JS object ready.',
  explanation,
  sizes: [10, 100, 1000],
  variants: [
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
