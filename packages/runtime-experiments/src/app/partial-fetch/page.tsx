// partial-fetch playground (Server Component shell).
//
// The actual playground UI is a Client Component below — it lists files in
// the pre-generated pack, lets the user pick one, then runs four delivery
// strategies side-by-side (range-fetched pack, whole-pack download, single
// HTTP, parallel multi-HTTP).

import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

import { PartialFetchClient } from './components/PartialFetchClient'

export const dynamic = 'force-dynamic'

export default function PartialFetchPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-8 space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70"
        href="/"
      >
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Partial fetch playground</h1>
        <p className="text-sm text-white/60">
          A pack token hosted on a CDN: can a client read one file from it without downloading the
          whole image? With <code className="text-white/80">pixel-range-png-brotli</code> the pack
          data lives in a PNG <code className="text-white/80">tpAK</code> ancillary chunk at known
          absolute byte offsets — the manifest is at the front, every file is independently
          deflate-compressed inside, so a single HTTP <code className="text-white/80">Range:</code>{' '}
          request pulls one file&apos;s bytes without decoding any pixels. This page runs that path
          alongside three baselines for comparison.
        </p>
      </header>

      <PartialFetchClient />
    </main>
  )
}
