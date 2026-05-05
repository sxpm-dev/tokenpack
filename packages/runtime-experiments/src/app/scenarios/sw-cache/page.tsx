import Link from 'next/link'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'

export default function SwCachePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-6">
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <h1 className="text-xl font-semibold tracking-tight">Service Worker cache</h1>
      <p className="mt-1 text-sm text-white/45 leading-relaxed">
        Compares repeat-visit boot time when the asset is delivered as a TokenPack PNG cached by a Service Worker
        vs. a brotli-encoded blob. The variant claim: brotli decompression-from-cache happens in JS (slow), but
        TokenPack overlaps decompression with the IDAT-chunk stream pipeline (fast).
      </p>

      <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-200">
        <strong>WIP scaffold.</strong> Working implementation needs:
        <ol className="mt-2 list-decimal list-inside space-y-1 text-yellow-100/80">
          <li>Service Worker registration + fetch interceptor</li>
          <li>Two cached fixtures (TokenPack PNG + brotli'd JSON)</li>
          <li>Cold-cache vs warm-cache iteration loops</li>
          <li>Browser cache-clearing helper between trials</li>
        </ol>
      </div>
    </main>
  )
}
