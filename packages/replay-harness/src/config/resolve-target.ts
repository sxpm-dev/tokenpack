import { existsSync } from 'node:fs'

import { publicDemo } from './targets/public-demo.js'
import type { TargetConfig } from './types.js'

const knownTargets = { 'public-demo': publicDemo } as const

/**
 * Resolve a CLI arg into a TargetConfig.
 *
 *   - "public-demo" or any other registered id → that target
 *   - https?://...                              → ad-hoc target derived from URL
 *
 * If a `storageState.json` exists alongside the resolved fixture dir, the
 * target is upgraded to use it automatically. This is what makes the
 * `login` → `record` → `benchmark` flow seamless: log in once, the saved
 * cookies get picked up by every subsequent run for the same id.
 */
export function resolveTargetArg(arg: string): TargetConfig {
  const known = knownTargets[arg as keyof typeof knownTargets]
  let target: TargetConfig

  if (known) {
    target = known
  } else if (/^https?:\/\//.test(arg)) {
    const host = new URL(arg).host.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')

    target = {
      id: host,
      url: arg,
      journey: { type: 'goto-only' },
      authMode: 'none',
      captureGraceMs: 2000,
    }
  } else {
    throw new Error(`first arg must be a known target id or http(s) URL: ${arg}`)
  }

  // Session storage lives outside `fixtures/` so wiping the fixture dir
  // doesn't take auth with it. The `login` script writes here; record /
  // baseline / benchmark read from here automatically.
  const candidatePath = target.storageStatePath ?? `session-storages/${target.id}.json`

  if (existsSync(candidatePath)) {
    return { ...target, authMode: 'storageState', storageStatePath: candidatePath }
  }

  return target
}
