import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-tp-border">
      <div className="absolute inset-0 tp-grid-fade" />
      <div className="relative mx-auto max-w-6xl px-6 pt-18 pb-16 lg:pt-24 lg:pb-20">
        <div className="flex max-w-5xl flex-col items-start gap-6">
          <h1 className="text-[clamp(2rem,4vw,3.25rem)] leading-[1.02] font-medium tracking-[-0.03em] whitespace-nowrap">
            Encode content into <span className="text-tp-accent">single image tokens</span>.
          </h1>

          <p className="max-w-3xl text-[1rem] leading-relaxed text-tp-muted">
            TokenPack serializes strings, file packs, and routed bundles into Image Token artifacts.
            Each token can be stored as a static image, transported through image-safe systems, and
            decoded back into a Pack API in Node or the browser.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="group inline-flex items-center gap-2 rounded-md bg-tp-fg px-5 py-2.5 text-[14px] font-medium text-tp-bg transition-transform hover:-translate-y-px"
              href="/docs/quickstart"
            >
              Quickstart
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-tp-border bg-tp-elev px-5 py-2.5 text-[14px] font-medium text-tp-fg transition-colors hover:border-tp-fg/40"
              href="/playground"
            >
              Try the playground
            </Link>
            <a
              className="ml-1 inline-flex items-center gap-1 text-[13px] text-tp-muted hover:text-tp-fg"
              href="https://github.com/anthropics/codeart"
            >
              github.com/anthropics/codeart →
            </a>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-tp-border bg-tp-border sm:grid-cols-3 lg:max-w-3xl">
            <Stat detail="parity for ~1 MB JS file" label="Wire size" value="≈ brotli-11" />
            <Stat detail="streaming image decode" label="First byte" value="2.7 ms" />
            <Stat detail="manifest + chunks" label="Range-fetch" value="HTTP-native" />
          </div>
        </div>
      </div>
    </section>
  )
}

interface StatProps {
  label: string
  value: string
  detail: string
}

function Stat({ label, value, detail }: StatProps) {
  return (
    <div className="bg-tp-bg p-4">
      <div className="text-[10px] tracking-[0.16em] text-tp-muted uppercase">{label}</div>
      <div className="mt-1 font-mono text-[15px] text-tp-fg">{value}</div>
      <div className="text-[11px] text-tp-muted">{detail}</div>
    </div>
  )
}
