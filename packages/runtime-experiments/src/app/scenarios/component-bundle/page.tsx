import Link from 'next/link'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'

export default function ComponentBundlePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-6">
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <h1 className="text-xl font-semibold tracking-tight">Component as Token</h1>
      <p className="mt-1 text-sm text-white/45 leading-relaxed">
        Pack a React component (compiled JS + extracted CSS + fonts + assets) into a single TokenPack PNG;
        compare against <code className="text-white/70">React.lazy</code> code-splitting and synchronous import.
        See <code>IDEAS.md</code> § "Component-as-Token — concrete spec" for the full design.
      </p>

      <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-200 space-y-3">
        <div>
          <strong>WIP scaffold.</strong> Working implementation needs:
        </div>
        <ol className="list-decimal list-inside space-y-1 text-yellow-100/80">
          <li>Build pipeline: esbuild + CSS extractor + asset-manifest emitter → CART archive → PNG</li>
          <li>Runtime <code>mountToken({'{'}{' '}src, target, externals, props {'}'})</code> that decodes the pack and evaluates via <code>import(blob:URL)</code></li>
          <li>Fixture: a real "heavy" component with CSS + a font + an icon</li>
          <li>Variants: sync import / React.lazy / async + JS brotli / TokenPack</li>
        </ol>
        <div>Risks documented: <code>import(blob:URL)</code> support, CSP <code>script-src 'self' blob:</code>, devtools sourcemaps.</div>
      </div>
    </main>
  )
}
