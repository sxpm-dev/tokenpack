import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'esbuild'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * Available browser strategies. Each one is a self-contained TS file in
 * `src/browser/strategies/` that exposes `window.__getPackFile(packId, path)`.
 *
 *   extract-full-fetch  First call to a pack: fetch whole token + buffered
 *                       decode, cache the DirPack. Non-streaming.
 *   extract-on-demand   First call to a pack: fetch+stream-decode, cache the
 *                       DirPack. Subsequent files in the same pack skip the
 *                       fetch and just call extract(). Lazy.
 *   extract-range-fetch First call to a pack: range-fetch manifest. Each
 *                       requested file uses buffered HTTP Range + inflate.
 *   extract-range-stream First call to a pack: range-fetch manifest. Each
 *                       requested file uses HTTP Range + streaming inflate.
 *   extract-range-fetch-all First call to a pack: range-fetch manifest, then
 *                       buffered-fetch and decompress every file in that pack.
 *   extract-range-stream-all First call to a pack: range-fetch manifest, then
 *                       stream all file regions in that pack and cache text.
 *   extract-range-stream-batch Range-fetch manifest, then group files that
 *                       arrive in a short window into shared range streams.
 *   extract-router-materialize Decode a router token, then load requested
 *                       files through the browser materialization API.
 *
 * Future:
 *   extract-all-eager   Decode + extractAll on startup; cache file bytes.
 *   prefetch-then-extract  Fetch all packs in parallel at startup, lazy extract.
 */
export type StrategyName =
  | 'extract-full-fetch'
  | 'extract-on-demand'
  | 'extract-range-fetch'
  | 'extract-range-stream'
  | 'extract-range-fetch-all'
  | 'extract-range-stream-all'
  | 'extract-range-stream-batch'
  | 'extract-router-materialize'

export const DEFAULT_STRATEGY: StrategyName = 'extract-on-demand'

export async function bundleBootstrap(strategy: StrategyName = DEFAULT_STRATEGY): Promise<string> {
  const reactStubDir = resolve(here, 'stubs/react')
  const reactDomStubDir = resolve(here, 'stubs/react-dom')
  const nodeEmptyStubFile = resolve(here, 'stubs/node-empty/index.js')
  const entry = resolve(here, 'strategies', `${strategy}.ts`)

  const result = await build({
    entryPoints: [entry],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    write: false,
    minify: false,
    alias: {
      react: reactStubDir,
      'react-dom': reactDomStubDir,
      'node:fs': nodeEmptyStubFile,
      'node:fs/promises': nodeEmptyStubFile,
      'node:os': nodeEmptyStubFile,
      'node:path': nodeEmptyStubFile,
      fs: nodeEmptyStubFile,
      os: nodeEmptyStubFile,
      path: nodeEmptyStubFile,
    },
  })
  const out = result.outputFiles[0]

  if (!out) throw new Error('esbuild produced no output')

  return out.text
}
