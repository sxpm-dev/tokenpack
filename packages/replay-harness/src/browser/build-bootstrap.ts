import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * Available browser strategies. Each one is a self-contained TS file in
 * `src/browser/strategies/` that exposes `window.__getPackFile(packId, path)`.
 *
 *   extract-on-demand   First call to a pack: fetch+stream-decode, cache the
 *                       DirPack. Subsequent files in the same pack skip the
 *                       fetch and just call extract(). Lazy.
 *
 * Future:
 *   extract-all-eager   Decode + extractAll on startup; cache file bytes.
 *   prefetch-then-extract  Fetch all packs in parallel at startup, lazy extract.
 */
export type StrategyName = 'extract-on-demand'

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
