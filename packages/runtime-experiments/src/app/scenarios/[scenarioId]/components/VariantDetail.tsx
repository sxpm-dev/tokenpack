'use client'

import { ScenarioExplanation } from '@/components/ScenarioExplanation'

interface VariantDetailProps {
  /** Optional markdown — if omitted, no panel rendered. */
  detail: string | undefined
}

/**
 * Inline expandable detail rendered under a variant row when expanded.
 * Receives the variant's `detail` markdown string from `VariantDef.detail`.
 */
export function VariantDetail({ detail }: VariantDetailProps) {
  if (!detail) return null

  return (
    <div className="px-3 py-2 bg-white/[0.02] border-l-2 border-white/10">
      <ScenarioExplanation markdown={detail} />
    </div>
  )
}
