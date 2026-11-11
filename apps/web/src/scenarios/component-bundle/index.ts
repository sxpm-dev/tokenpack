// component-bundle scenario — browser-side definition.
//
// Compares two delivery strategies for a multi-file UI bundle, across three
// realistic bundle weights:
//
//   small   ·  10 KB total ·  2 files
//   medium  ·  50 KB total ·  5 files
//   large   · 200 KB total · 20 files
//
// Six variants total — three sizes × two strategies — so a single Run shows
// the full size sweep in one table. Both strategies end the same way:
// dynamic-`import()` the entry JS module from a blob URL and `mount()` it.

import { decode } from '@tokenpack/browser'

import type { RunCtx, RunMetric, ScenarioDef, VariantDef } from '../types'

interface SizePreset {
  totalKb: number
  fileCount: number
  label: string
}

const SIZE_PRESETS: readonly SizePreset[] = [
  { totalKb: 50, fileCount: 5, label: 'small' },
  { totalKb: 200, fileCount: 10, label: 'medium' },
  { totalKb: 1024, fileCount: 20, label: 'large' },
  { totalKb: 5120, fileCount: 50, label: 'huge' },
]

type RawEncoding = 'identity' | 'gzip' | 'brotli'

interface RawEncodingSpec {
  encoding: RawEncoding
  apiQuery: Record<string, string>
  label: string
  detailHint: string
}

const RAW_ENCODINGS: readonly RawEncodingSpec[] = [
  {
    encoding: 'identity',
    apiQuery: {},
    label: 'no encoding',
    detailHint: 'No `Content-Encoding`. Bytes hit the wire uncompressed.',
  },
  {
    encoding: 'gzip',
    apiQuery: { encoding: 'gz' },
    label: 'gzip',
    detailHint:
      '`Content-Encoding: gzip`. Server pre-gzipped (level 6); browser auto-decompresses.',
  },
  {
    encoding: 'brotli',
    apiQuery: { encoding: 'br' },
    label: 'brotli',
    detailHint:
      '`Content-Encoding: br`. Server pre-brotli-compressed (quality 6); browser auto-decompresses.',
  },
]

const explanation = `## What's going on

A typical UI chunk is *multiple files* — entry JS, scoped CSS, lazy chunks.
Each is a separate HTTP request. This scenario compares two ways to ship
one of those chunks at three realistic weights.

| Size | Total | Files |
|---|---|---|
| small | 50 KB | entry + css + 3 chunks (5 files) |
| medium | 200 KB | + 8 chunks (10 files) |
| large | 1 MB | + 18 chunks (20 files) |
| huge | 5 MB | + 48 chunks (50 files) |

Chunks alternate \`chunk-{odd}.js\` (slices of a real bundled JS file) and
\`chunk-{even}.json\` (deterministic JSON payloads) — realistic byte-level
entropy, so gzip / brotli numbers reflect a real bundle's compressibility
instead of a "lorem ipsum" floor.

| Strategy | What's fetched | Network shape |
|---|---|---|
| \`raw · no encoding\` | N raw files | N parallel fetches; bytes hit the wire uncompressed |
| \`raw · gzip\` | N \`.gz\` files | N parallel fetches; \`Content-Encoding: gzip\` (browser auto-decompresses) |
| \`raw · brotli\` | N \`.br\` files | N parallel fetches; \`Content-Encoding: br\` (browser auto-decompresses) |
| \`tokenpack DirPack\` | a single \`.png\` | 1 fetch, native multi-file pack inside |

\`\`\`ts
// tokenpack path
const blob = await (await fetch(pngUrl)).blob()
const pack = await decode(blob)
if (!pack.isPack()) throw new Error('expected a DirPack')
const entries = await pack.extractAll() // [{ path: 'index.js', bytes }, ...]
applyCss(entries)
const url = URL.createObjectURL(new Blob([entryJsBytes], { type: 'application/javascript' }))
const mod = await import(url)
mod.mount(rootElement)
\`\`\`

Throttle dramatically changes the picture — try \`Slow\` to see N parallel
header round-trips bite hardest at the 20-file size.
`

function fileListFor(preset: SizePreset): readonly string[] {
  const list: string[] = ['index.js', 'index.css']

  for (let i = 1; i <= preset.fileCount - 2; i += 1) {
    // Mirrors the build's mix: even index → .json payload, odd → .js slice.
    list.push(`chunk-${i}.${i % 2 === 0 ? 'json' : 'js'}`)
  }

  return list
}

function makeRawVariant(preset: SizePreset, enc: RawEncodingSpec): VariantDef {
  const encSuffix = enc.encoding === 'identity' ? 'raw' : enc.encoding

  return {
    id: `raw-chunked-${encSuffix}-${preset.totalKb}kb`,
    label: `raw chunked · ${enc.label} · ${preset.label} · ${preset.totalKb} KB / ${preset.fileCount} files`,
    compat: 'full',
    detail: `${preset.fileCount} parallel \`fetch\` calls. ${enc.detailHint} Every file is text-decoded so bytes are actually consumed.`,
    run: ctx => runRawChunked(ctx, preset, enc),
  }
}

function makeBundledVariant(preset: SizePreset, enc: RawEncodingSpec): VariantDef {
  const encSuffix = enc.encoding === 'identity' ? 'raw' : enc.encoding

  return {
    id: `raw-bundled-${encSuffix}-${preset.totalKb}kb`,
    label: `raw bundled · ${enc.label} · ${preset.label} · ${preset.totalKb} KB / 2 files`,
    compat: 'full',
    detail: `Single bundle: 1 big \`bundled.js\` (with JSON inlined as a const) + 1 big \`bundled.css\`. ${enc.detailHint} 2 parallel fetches.`,
    run: ctx => runRawBundled(ctx, preset, enc),
  }
}

function makeTokenpackVariant(preset: SizePreset): VariantDef {
  return {
    id: `tokenpack-multifile-${preset.totalKb}kb`,
    label: `tokenpack DirPack · 1 token · ${preset.label} · ${preset.totalKb} KB / ${preset.fileCount} files`,
    compat: 'full',
    detail: `Single PNG fetch. \`decode(blob)\` → \`DirPack\` → \`extractAll()\` returns all ${preset.fileCount} files. CSS appended, entry JS dynamic-imported from a blob URL.`,
    run: ctx => runTokenpackMultifile(ctx, preset),
  }
}

const SUB_PACK_TOTAL = 5

function makeTokenpackSubPacksVariant(preset: SizePreset): VariantDef {
  const n = Math.min(SUB_PACK_TOTAL, preset.fileCount)

  return {
    id: `tokenpack-subpacks-${preset.totalKb}kb`,
    label: `tokenpack DirPack · ${n} tokens · ${preset.label} · ${preset.totalKb} KB / ${preset.fileCount} files`,
    compat: 'full',
    detail: `${n} parallel PNG fetches, each an independent DirPack containing ~${Math.ceil(preset.fileCount / n)} files. \`decode(blob)\` per sub-pack → merge entries by path → CSS + mount.`,
    run: ctx => runTokenpackSubPacks(ctx, preset, n),
  }
}

export const componentBundleScenario: ScenarioDef = {
  id: 'component-bundle',
  name: 'Component bundle (multi-file TokenPack)',
  description:
    'N parallel asset fetches vs. one TokenPack PNG containing the same files as a native DirPack — three sizes shown side-by-side.',
  explanation,
  variants: [
    ...RAW_ENCODINGS.flatMap(enc => SIZE_PRESETS.map(p => makeBundledVariant(p, enc))),
    ...RAW_ENCODINGS.flatMap(enc => SIZE_PRESETS.map(p => makeRawVariant(p, enc))),
    ...SIZE_PRESETS.map(makeTokenpackVariant),
    ...SIZE_PRESETS.map(makeTokenpackSubPacksVariant),
  ],
}

async function runRawChunked(
  ctx: RunCtx,
  preset: SizePreset,
  enc: RawEncodingSpec,
): Promise<RunMetric> {
  const files = fileListFor(preset)
  const stage = prepareStage()

  try {
    const t0 = performance.now()
    const responses = await Promise.all(
      files.map(name => ctx.fetchFixture(`bundle-${preset.totalKb}kb-${name}`, enc.apiQuery)),
    )

    for (const r of responses) {
      if (!r.ok) throw new Error(`fixture fetch failed: ${r.status}`)
    }

    const wireBytes = responses.reduce((sum, r) => {
      const cl = Number(r.headers.get('content-length'))

      return sum + (Number.isFinite(cl) && cl > 0 ? cl : 0)
    }, 0)

    // text() forces FULL body consumption + UTF-8 decode for EVERY file.
    // This is the honest "ready to parse" state — without it the runtime
    // could in principle defer some byte materialization (per the user's
    // concern about hidden compiler/JIT optimizations).
    const texts = await Promise.all(responses.map(r => r.text()))
    let touchAcc = 0

    for (const t of texts) if (t.length > 0) touchAcc += t.charCodeAt(0)
    sinkSideEffect(touchAcc)

    const filesByName = new Map<string, string>()

    for (let i = 0; i < files.length; i += 1) filesByName.set(files[i], texts[i])

    const cssText = filesByName.get('index.css') ?? ''
    const jsText = filesByName.get('index.js') ?? ''

    applyCss(stage, cssText)
    const mountInfo = await importAndMount(jsText, stage)
    const totalMs = performance.now() - t0
    const fallbackBytes = texts.reduce((s, t) => s + new TextEncoder().encode(t).byteLength, 0)
    const decodedBytes = new TextEncoder().encode(texts.join('\n'))

    return {
      totalMs,
      wireBytes: wireBytes > 0 ? wireBytes : fallbackBytes,
      decodedBytes,
      stages: { executeMs: mountInfo.mountMs },
    }
  } finally {
    cleanupStage(stage)
  }
}

async function runRawBundled(
  ctx: RunCtx,
  preset: SizePreset,
  enc: RawEncodingSpec,
): Promise<RunMetric> {
  const stage = prepareStage()

  try {
    const t0 = performance.now()
    const [jsResp, cssResp] = await Promise.all([
      ctx.fetchFixture(`bundle-${preset.totalKb}kb-bundled.js`, enc.apiQuery),
      ctx.fetchFixture(`bundle-${preset.totalKb}kb-bundled.css`, enc.apiQuery),
    ])

    if (!jsResp.ok || !cssResp.ok) {
      throw new Error(`bundled fetch failed: ${jsResp.status}/${cssResp.status}`)
    }

    const wireBytes = [jsResp, cssResp].reduce((sum, r) => {
      const cl = Number(r.headers.get('content-length'))

      return sum + (Number.isFinite(cl) && cl > 0 ? cl : 0)
    }, 0)

    const [jsText, cssText] = await Promise.all([jsResp.text(), cssResp.text()])

    sinkSideEffect((jsText.length > 0 ? jsText.charCodeAt(0) : 0) + cssText.length)

    applyCss(stage, cssText)
    const mountInfo = await importAndMount(jsText, stage)
    const totalMs = performance.now() - t0
    const fallbackBytes =
      new TextEncoder().encode(jsText).byteLength + new TextEncoder().encode(cssText).byteLength
    const decodedBytes = new TextEncoder().encode(jsText + '\n' + cssText)

    return {
      totalMs,
      wireBytes: wireBytes > 0 ? wireBytes : fallbackBytes,
      decodedBytes,
      stages: { executeMs: mountInfo.mountMs },
    }
  } finally {
    cleanupStage(stage)
  }
}

async function runTokenpackMultifile(ctx: RunCtx, preset: SizePreset): Promise<RunMetric> {
  const stage = prepareStage()

  try {
    const t0 = performance.now()
    const resp = await ctx.fetchFixture(`bundle-${preset.totalKb}kb.tokenpack-deflate.png`)

    if (!resp.ok) throw new Error(`fixture fetch failed: ${resp.status}`)
    const blob = await resp.blob()
    const wireBytes = blob.size
    const pack = await decode(blob)

    if (!pack.isPack()) {
      throw new Error('expected DirPack (multi-file) — got file or diff pack')
    }

    const entries = await pack.extractAll()
    // Text-decode EVERY entry to match the raw-chunked path's work (which
    // calls `r.text()` per fetch). Without this, the TokenPack path would
    // skip the UTF-8 decode of chunk bytes and look artificially faster.
    const dec = new TextDecoder()
    const filesByName = new Map<string, string>()
    let touchAcc = 0

    for (const e of entries) {
      const text = dec.decode(e.bytes)

      filesByName.set(e.path, text)
      if (text.length > 0) touchAcc += text.charCodeAt(0)
    }
    sinkSideEffect(touchAcc)

    const cssText = filesByName.get('index.css') ?? ''
    const jsText = filesByName.get('index.js') ?? ''

    applyCss(stage, cssText)
    const mountInfo = await importAndMount(jsText, stage)
    const totalMs = performance.now() - t0

    return {
      totalMs,
      wireBytes,
      decodedBytes: concatEntries(entries),
      stages: { executeMs: mountInfo.mountMs },
    }
  } finally {
    cleanupStage(stage)
  }
}

async function runTokenpackSubPacks(
  ctx: RunCtx,
  preset: SizePreset,
  subPackTotal: number,
): Promise<RunMetric> {
  const stage = prepareStage()

  try {
    const t0 = performance.now()
    // Fire all N sub-pack fetches in parallel — that's the whole point of
    // splitting into multiple tokens.
    const responses = await Promise.all(
      Array.from({ length: subPackTotal }, (_, k) =>
        ctx.fetchFixture(`bundle-${preset.totalKb}kb.subpack-${k + 1}of${subPackTotal}.png`),
      ),
    )

    for (const r of responses) {
      if (!r.ok) throw new Error(`sub-pack fetch failed: ${r.status}`)
    }

    const blobs = await Promise.all(responses.map(r => r.blob()))
    const wireBytes = blobs.reduce((s, b) => s + b.size, 0)

    // Decode each sub-pack independently. Each is a self-contained DirPack
    // (own header + streamId), so they parallelize cleanly.
    const packs = await Promise.all(blobs.map(b => decode(b)))

    // Merge entries from all sub-packs by file path. Same-path collisions
    // shouldn't happen by construction but we keep the LAST seen for safety.
    const dec = new TextDecoder()
    const filesByName = new Map<string, string>()
    let touchAcc = 0
    let totalDecodedBytes = 0
    const allEntriesForFingerprint: { path: string; bytes: Uint8Array }[] = []

    await Promise.all(
      packs.map(async pack => {
        if (!pack.isPack()) {
          throw new Error('expected DirPack — sub-pack returned file or diff pack')
        }
        const entries = await pack.extractAll()

        for (const e of entries) {
          const text = dec.decode(e.bytes)

          filesByName.set(e.path, text)
          if (text.length > 0) touchAcc += text.charCodeAt(0)
          totalDecodedBytes += e.bytes.byteLength
          allEntriesForFingerprint.push(e)
        }
      }),
    )
    sinkSideEffect(touchAcc)

    const cssText = filesByName.get('index.css') ?? ''
    const jsText = filesByName.get('index.js') ?? ''

    if (!jsText) throw new Error('sub-packs missing index.js')

    applyCss(stage, cssText)
    const mountInfo = await importAndMount(jsText, stage)
    const totalMs = performance.now() - t0

    return {
      totalMs,
      wireBytes,
      decodedBytes: concatEntries(allEntriesForFingerprint),
      stages: { executeMs: mountInfo.mountMs },
    }
  } finally {
    cleanupStage(stage)
  }
}

/**
 * Side-effect sink for the per-iteration "touch" of decoded text. Writing
 * the value to a global ensures the engine cannot DCE the text-decoding
 * work — without this, an aggressive optimizer might spot that the strings
 * aren't observably read and elide the materialization.
 */
function sinkSideEffect(value: number): void {
  ;(globalThis as any).__rtExpComponentBundleSink = value
}

function concatEntries(entries: readonly { path: string; bytes: Uint8Array }[]): Uint8Array {
  const sorted = [...entries].sort((a, b) => (a.path < b.path ? -1 : 1))
  const total = sorted.reduce((s, e) => s + e.bytes.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0

  for (const e of sorted) {
    out.set(e.bytes, offset)
    offset += e.bytes.byteLength
  }

  return out
}

interface Stage {
  host: HTMLElement
  styleNode: HTMLStyleElement
}

/**
 * Build a fresh, empty mount host + stylesheet *before* the timer starts.
 * Both nodes are detached from any previous iteration's state, so the
 * mount-time measurement isn't biased by leftover DOM cleanup. The host is
 * positioned offscreen so it never paints to the user.
 */
function prepareStage(): Stage {
  const host = document.createElement('div')

  host.className = 'rt-exp-component-bundle-stage'
  host.style.cssText = 'position:absolute; left:-9999px; top:-9999px; width:1px; height:1px;'
  document.body.appendChild(host)

  const styleNode = document.createElement('style')

  styleNode.dataset.rtExp = 'component-bundle'
  document.head.appendChild(styleNode)

  return { host, styleNode }
}

function cleanupStage(stage: Stage): void {
  stage.host.remove()
  stage.styleNode.remove()
}

function applyCss(stage: Stage, cssText: string): void {
  stage.styleNode.textContent = cssText
}

async function importAndMount(jsText: string, stage: Stage): Promise<{ mountMs: number }> {
  const blob = new Blob([jsText], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)

  try {
    const mod: { mount: (el: HTMLElement, opts?: { label?: string }) => number } = await import(
      /* webpackIgnore: true */
      /* @vite-ignore */
      url
    )

    if (typeof mod.mount !== 'function') throw new Error('imported module missing mount()')
    const mountMs = mod.mount(stage.host, { label: 'rt-exp' })

    return { mountMs }
  } finally {
    URL.revokeObjectURL(url)
  }
}
