// Central registry of all playground scenarios. Adding a new scenario =
// import its `ScenarioDef` and append it here. The generation script and the
// `[scenarioId]` page template both read from this list.
//
// Server-only fixture builders live in `./builders.ts` and import per-scenario
// `<id>/build.ts` modules. That split keeps Node-only deps (zlib, sharp,
// @tokenpack/node) out of the client bundle.

import { componentBundleScenario } from './component-bundle'
import { diffVersioningScenario } from './diff-versioning'
import { inlineDataUriScenario } from './inline-data-uri'
import { ssrStreamingScenario } from './ssr-streaming'
import { streamBootScenario } from './stream-boot'
import { swCacheScenario } from './sw-cache'
import type { ScenarioDef } from './types'

export const SCENARIOS: readonly ScenarioDef[] = [
  inlineDataUriScenario,
  streamBootScenario,
  swCacheScenario,
  ssrStreamingScenario,
  componentBundleScenario,
  diffVersioningScenario,
]

export function findScenario(id: string): ScenarioDef | undefined {
  return SCENARIOS.find(s => s.id === id)
}
