import { algorithmCatalog } from 'tokenpack/algorithms/catalog'

import type { EncodeConfig } from '@/components/EncodeForm'

import { resolveAlgoName } from './encode-options'

export interface FEEligibility {
  ok: boolean
  reason?: string
}

/**
 * Decide whether the chosen algorithm can encode in the browser.
 *
 * Rules:
 *   1. Algorithm must be registered in the browser-side catalog.
 *   2. Its `capabilities.environments` must include `'browser'`.
 *   3. Brotli-bound algorithms always require server (browsers don't ship
 *      `CompressionStream('br')`). We detect this by inspecting the resolved
 *      compressor's family id.
 *
 * No hardcoded SERVER_ONLY_ALGOS list — eligibility flows from the algorithm's
 * declared capabilities.
 */
export function checkFEEligibility(config: EncodeConfig): FEEligibility {
  const algoName = resolveAlgoName(config)
  let Ctor

  try {
    Ctor = algorithmCatalog.getByName(algoName)
  } catch {
    return { ok: false, reason: `${algoName} not registered in the browser catalog` }
  }

  if (!Ctor.capabilities.environments.includes('browser')) {
    return { ok: false, reason: `${algoName} requires server-side encoding` }
  }

  // Brotli encode is server-only — `CompressionStream('br')` is decode-only
  // (or unavailable) in every shipped browser today.
  const compressorFamily = (Ctor.Compressor as unknown as { familyId?: string }).familyId

  if (compressorFamily === 'brotli') {
    return {
      ok: false,
      reason: `${algoName} uses Brotli — browser CompressionStream('br') is not available; encode runs on the server`,
    }
  }

  return { ok: true }
}
