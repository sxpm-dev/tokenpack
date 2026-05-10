// partial-fetch playground — server-only fixture builder.
//
// The point of this scenario: prove that a remote pack token can be partially
// fetched from a CDN. We pre-generate a multi-file pack as
// `pixel-range-png-brotli` (data lives in a `tpAK` PNG ancillary chunk at
// known absolute byte offsets), plus the same files individually, plus a
// `linear-deflate` pack for the "whole-pack download + decode" comparison.
//
// The browser playground at `/partial-fetch` issues HTTP `Range:` requests
// against the pixel-range pack to pull a single file's compressed bytes
// without decoding any pixels — `fetchPackFile()` from `@tokenpack/browser`.

import { encode } from '@tokenpack/node'
import { NodePackBuilder } from '@tokenpack/node/node-pack-builder'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { BuildCtx, BuildFixturesFn, FixtureFile } from '../types'

const HERE = path.dirname(fileURLToPath(import.meta.url))
// Same real-bundled JS source the component-bundle scenario slices from —
// realistic byte entropy so per-file deflate ratios reflect a real bundle.
const REAL_JS_SOURCE_PATH = path.resolve(HERE, '../../../../../benchmark/sources/chunk-5mb.js')

const FILE_COUNT = 10
const FILE_BYTES = 5 * 1024 // 5 KB per file → 50 KB total
const TOTAL_KB = (FILE_COUNT * FILE_BYTES) / 1024

let cachedRealSource: Buffer | null = null

function loadRealSource(): Buffer {
  if (cachedRealSource) return cachedRealSource
  if (!fs.existsSync(REAL_JS_SOURCE_PATH)) {
    throw new Error(
      `partial-fetch: real JS source not found at ${REAL_JS_SOURCE_PATH}. ` +
        'Expected a real bundled JS file to slice chunks from.',
    )
  }
  cachedRealSource = fs.readFileSync(REAL_JS_SOURCE_PATH)

  return cachedRealSource
}

/**
 * Generate N self-contained ES modules that each export a `run()` function.
 * Each module starts with a unique JS sentinel that the playground asserts
 * after dynamic-import to prove the right file was fetched. The bulk of each
 * module is a slice of real bundled JS so deflate ratios are realistic.
 */
function generateModules(): Map<string, Buffer> {
  const real = loadRealSource()
  const out = new Map<string, Buffer>()

  for (let i = 0; i < FILE_COUNT; i += 1) {
    const name = `module-${String(i).padStart(2, '0')}.js`
    const sliceStart = ((i * FILE_BYTES) % (real.length - FILE_BYTES + 1) + real.length) %
      (real.length - FILE_BYTES + 1)
    const realSlice = real.subarray(sliceStart, sliceStart + FILE_BYTES - 256).toString('utf-8')
    // Wrap in an ES-module shape that exports `run(stage)`. The sentinel is
    // included in `run()`'s return so the playground can verify which file
    // actually executed.
    const sentinel = `partial-fetch-${i}`
    const moduleSource = `// ${name}
// real-source slice + sentinel — total ~${FILE_BYTES}B
const REAL_SLICE_BYTES = ${realSlice.length}
const SENTINEL = ${JSON.stringify(sentinel)}
${commentOut(realSlice)}
export function run(stage) {
  if (stage && typeof stage.appendChild === 'function') {
    const div = document.createElement('div')
    div.textContent = 'loaded ' + SENTINEL + ' (real-slice ' + REAL_SLICE_BYTES + 'B)'
    stage.appendChild(div)
  }
  return SENTINEL
}
`
    const moduleBytes = Buffer.from(moduleSource, 'utf-8')

    // Pad to nominal size with whitespace so all modules have similar wire
    // weight — keeps the per-file fetch comparison apples-to-apples.
    const padNeeded = Math.max(0, FILE_BYTES - moduleBytes.length)
    const padded = Buffer.concat([moduleBytes, Buffer.alloc(padNeeded, 0x20)])

    out.set(name, padded)
  }

  return out
}

/**
 * Wrap each line of a real-source slice in a JS line comment so the slice
 * never breaks the surrounding ES-module syntax. (The slice is bytes from a
 * real bundle — would otherwise contain a stray brace or string-literal that
 * derails the parser.)
 */
function commentOut(text: string): string {
  return text
    .split('\n')
    .map(line => '// ' + line)
    .join('\n')
}

export const buildPartialFetchFixtures: BuildFixturesFn = async (
  _ctx: BuildCtx,
): Promise<FixtureFile[]> => {
  const fileMap = generateModules()
  const files: FixtureFile[] = []

  // 1) The PixelRange pack — `tpAK` chunk holds the pack-format manifest +
  //    per-file deflate-9 regions at known absolute byte offsets.
  const pixelRangeBuilder = new NodePackBuilder()

  for (const [name, bytes] of fileMap) {
    pixelRangeBuilder.withFile(name, new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength))
  }
  const pixelRangePng = await encode(pixelRangeBuilder, {
    algo: 'pixel-range',
    compressor: 'deflate-9', // per-region; FE-friendly
  })

  files.push({
    path: 'pack.pixel-range.png',
    bytes: Buffer.from(pixelRangePng),
    meta: {
      mime: 'image/png',
      totalKb: TOTAL_KB,
      fileCount: fileMap.size,
      encoding: 'pixel-range-png-brotli + deflate-9 regions',
      role: 'partial-fetch primary',
    },
  })

  // 2) The same files in a `linear-deflate` pack — for the "whole-pack
  //    download + decode + extract one file" comparison.
  const linearBuilder = new NodePackBuilder()

  for (const [name, bytes] of fileMap) {
    linearBuilder.withFile(name, new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength))
  }
  const linearPng = await encode(linearBuilder, {
    algo: 'linear-deflate',
    algoOptions: { compressor: { level: 6 }, surface: { channels: 3 } },
    compressor: 'deflate-6',
  })

  files.push({
    path: 'pack.linear-deflate.png',
    bytes: Buffer.from(linearPng),
    meta: {
      mime: 'image/png',
      totalKb: TOTAL_KB,
      fileCount: fileMap.size,
      encoding: 'linear-deflate (pixel-encoded pack)',
      role: 'whole-pack comparison',
    },
  })

  // 3) Each module as a standalone HTTP fixture (no packing).
  for (const [name, bytes] of fileMap) {
    files.push({
      path: name,
      bytes,
      meta: { mime: 'application/javascript', encoding: 'identity', role: 'http-individual' },
    })
  }

  // 4) A small JSON index so the playground UI can list files without
  //    parsing the manifest itself.
  const index = {
    files: Array.from(fileMap.entries()).map(([name, bytes]) => ({ path: name, size: bytes.length })),
    totalKb: TOTAL_KB,
  }

  files.push({
    path: 'index.json',
    bytes: Buffer.from(JSON.stringify(index, null, 2), 'utf-8'),
    meta: { mime: 'application/json', encoding: 'identity', role: 'index' },
  })

  return files
}
