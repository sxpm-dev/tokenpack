// component-bundle scenario — custom override page (Server Component).
//
// Required because the generic [scenarioId] template renders all variants in
// a single flat table. component-bundle has 28 variants grouped naturally by
// total size; size tabs + a per-tab table is much easier to read.

import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { ComponentBundleClient } from './components/ComponentBundleClient'

export const dynamic = 'force-dynamic'

export default function ComponentBundlePage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-xs text-tp-muted hover:text-tp-fg"
        href="/experiments"
      >
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <ComponentBundleClient />
    </main>
  )
}
