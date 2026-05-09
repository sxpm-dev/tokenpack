// Server-only builder index. Maps scenario id → fixture-builder function.
// Imported ONLY by `scripts/generate-fixtures.ts`. Never reachable from client
// pages, so Node-only deps (`zlib`, `@tokenpack/node`, `esbuild`) stay out of
// the browser bundle.

import { buildComponentBundleFixtures } from './component-bundle/build'
import { buildDiffVersioningFixtures } from './diff-versioning/build'
import { buildInlineDataUriFixtures } from './inline-data-uri/build'
import { buildSsrStreamingFixtures } from './ssr-streaming/build'
import { buildStreamBootFixtures } from './stream-boot/build'
import { buildSwCacheFixtures } from './sw-cache/build'
import type { BuildFixturesFn } from './types'

export const BUILDERS: Record<string, BuildFixturesFn> = {
  'inline-data-uri': buildInlineDataUriFixtures,
  'stream-boot': buildStreamBootFixtures,
  'sw-cache': buildSwCacheFixtures,
  'ssr-streaming': buildSsrStreamingFixtures,
  'component-bundle': buildComponentBundleFixtures,
  'diff-versioning': buildDiffVersioningFixtures,
}
