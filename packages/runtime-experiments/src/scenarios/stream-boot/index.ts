// Stream-boot scenario — browser-side definition.
//
// Unlike `inline-data-uri`, here the timer wraps the **full** path:
// `t0 = performance.now()` → fetch → decode → JSON.parse → totalMs.
//
// The point: TokenPack's `decodeStream(response.body)` pipelines PNG decode
// + inner decompression with the network transfer — bytes are decompressed
// as soon as the first IDAT chunk arrives, so on a slow link the decode
// finishes only milliseconds after the last byte hits the wire. The base64
// and bulk-decompress variants are forced to wait for the whole body, *then*
// run the JS pipeline.
//
// All variants ship raw bytes (no base64). The throttle selector at the page
// level shapes the response body — try `Slow` to see the streaming win.

import { decodeStream } from '@tokenpack/browser'

import type { RunCtx, ScenarioDef } from '../types'

const explanation = `## What's going on

The previous scenario timed *asset-in-memory → JS object*. This one widens
the window to the full path *fetch start → JS object ready*. That single
change exposes a thing the previous can't: **TokenPack can begin
decompression while bytes are still arriving over the network.**

Use the throttle selector at the top of the page (try \`Slow\` ≈ 256 KB/s)
to make the win visible — on Local the network is so fast nothing is
overlapped.

### Variants

| Variant | What flies over the wire | Decode pipeline |
|---|---|---|
| \`raw-json\` | plain JSON | \`fetch\` → \`text()\` → \`JSON.parse\` (sequential) |
| \`deflate-bulk\` | deflate-compressed JSON | \`fetch\` → \`blob\` → \`DecompressionStream('deflate')\` → \`JSON.parse\` (sequential) |
| \`brotli-bulk\` | brotli-compressed JSON | \`fetch\` → \`blob\` → \`DecompressionStream('br')\` → \`JSON.parse\` (sequential) |
| \`tokenpack-stream-deflate\` | TokenPack PNG (deflate-6) | \`fetch\` → \`decodeStream(response.body)\` → \`JSON.parse\` (pipelined) |
| \`tokenpack-stream-brotli\` | TokenPack PNG (brotli-6) | \`fetch\` → \`decodeStream(response.body)\` → \`JSON.parse\` (pipelined) |

### Streaming TokenPack pipeline

\`\`\`ts
const t0 = performance.now()
const resp = await fetch('/asset.png')
// pipelined: PNG IDAT chunks → image decode → codec → DecompressionStream → bytes
const pack = await decodeStream(resp.body!)
const obj  = JSON.parse(new TextDecoder().decode(await pack.content()))
const totalMs = performance.now() - t0
\`\`\`

### Bulk-decompress comparison

\`\`\`ts
const t0 = performance.now()
const resp = await fetch('/asset.deflate.bin')
const blob = await resp.blob()                       // wait for the whole body
const stream = blob.stream()
  .pipeThrough(new DecompressionStream('deflate'))
const text = await new Response(stream).text()
const obj  = JSON.parse(text)
const totalMs = performance.now() - t0
\`\`\`
`

export const streamBootScenario: ScenarioDef = {
  id: 'stream-boot',
  name: 'Stream boot (network + decode)',
  description:
    'Timer wraps the full fetch + decode + parse path. Demonstrates pipelined PNG decompression overlapping with transfer on slow networks.',
  explanation,
  sizes: [10, 100, 1000],
  variants: [
    {
      id: 'raw-json',
      label: 'raw JSON',
      compat: 'full',
      detail: '`fetch` → `text()` → `JSON.parse`. No compression, no decode pipeline.',
      run: ctx => runRawJson(ctx, fileFor('raw', ctx.size)),
    },
    {
      id: 'deflate-bulk',
      label: 'deflate (bulk decompress)',
      compat: 'full',
      detail:
        '`fetch` → `blob()` → `DecompressionStream("deflate")` → `JSON.parse`. Decompression starts after the full body arrives.',
      run: ctx => runBulkDecompress(ctx, fileFor('deflate', ctx.size), 'deflate'),
    },
    {
      id: 'brotli-bulk',
      label: 'brotli (bulk decompress)',
      compat: 'partial',
      detail:
        '`fetch` → `blob()` → `DecompressionStream("br")` → `JSON.parse`. Needs `DecompressionStream("br")`.',
      run: ctx => runBulkDecompress(ctx, fileFor('br', ctx.size), 'br'),
    },
    {
      id: 'tokenpack-stream-deflate',
      label: 'tokenpack stream (deflate-6)',
      compat: 'full',
      detail:
        '`fetch` → `decodeStream(response.body)`. PNG decode + deflate decompression run in lockstep with the network — the second the last IDAT chunk arrives, the JSON is essentially ready.',
      run: ctx => runTokenpackStream(ctx, fileFor('tokenpack-deflate', ctx.size)),
    },
    {
      id: 'tokenpack-stream-brotli',
      label: 'tokenpack stream (brotli-6)',
      compat: 'full',
      detail:
        'Same as `tokenpack-stream-deflate` but with brotli-6 inner. Browser brotli support not required — `decodeStream` uses TokenPack codec internals, not `DecompressionStream("br")`.',
      run: ctx => runTokenpackStream(ctx, fileFor('tokenpack-brotli', ctx.size)),
    },
  ],
}

function fileFor(
  kind: 'raw' | 'deflate' | 'br' | 'tokenpack-deflate' | 'tokenpack-brotli',
  size: number | null,
): string {
  if (size === null) throw new Error('stream-boot: size is required')
  if (kind === 'raw') return `payload-${size}kb.json`
  if (kind === 'deflate' || kind === 'br') return `payload-${size}kb.${kind}.bin`

  return `payload-${size}kb.${kind}.png`
}

async function runRawJson(ctx: RunCtx, file: string) {
  const t0 = performance.now()
  const resp = await ctx.fetchFixture(file)

  if (!resp.ok) throw new Error(`fixture fetch failed: ${resp.status}`)
  const text = await resp.text()

  JSON.parse(text)
  const totalMs = performance.now() - t0
  const bytes = new TextEncoder().encode(text)

  return { totalMs, wireBytes: bytes.byteLength, decodedBytes: bytes }
}

async function runBulkDecompress(ctx: RunCtx, file: string, format: 'deflate' | 'br') {
  const t0 = performance.now()
  const resp = await ctx.fetchFixture(file)

  if (!resp.ok) throw new Error(`fixture fetch failed: ${resp.status}`)
  const blob = await resp.blob()
  const wireBytes = blob.size
  const stream = blob
    .stream()
    .pipeThrough(new (DecompressionStream as unknown as new (f: string) => TransformStream)(format))
  const decompressed = new Uint8Array(await new Response(stream).arrayBuffer())

  JSON.parse(new TextDecoder().decode(decompressed))
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes, decodedBytes: decompressed }
}

async function runTokenpackStream(ctx: RunCtx, file: string) {
  const t0 = performance.now()
  const resp = await ctx.fetchFixture(file)

  if (!resp.ok) throw new Error(`fixture fetch failed: ${resp.status}`)
  const wireBytes = Number(resp.headers.get('content-length')) || 0

  if (!resp.body) throw new Error('response has no body stream')

  const pack = await decodeStream(resp.body)

  if (pack.isPack() || pack.isDiff()) {
    throw new Error('expected single-file Pack')
  }
  const bytes = await pack.content()

  JSON.parse(new TextDecoder().decode(bytes))
  const totalMs = performance.now() - t0

  return { totalMs, wireBytes, decodedBytes: bytes }
}
