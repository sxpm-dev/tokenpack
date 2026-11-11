import Link from 'next/link'

import { CodeBlock } from '@/components/CodeBlock/CodeBlock'

const SNIPPET = `import { encode, decode } from '@tokenpack/node'

const r = await encode(Buffer.from('hello world'))
const pack = await decode(r.bytes)

console.log(await pack.text())   // → "hello world"`

export function CallToAction() {
  return (
    <section className="relative overflow-hidden border-b border-tp-border bg-tp-bg">
      <div className="absolute inset-0 tp-grid-fade opacity-50" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center gap-7">
          <div className="text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § Five-minute path
          </div>
          <h2 className="text-[clamp(2rem,4vw,3.25rem)] leading-[1] font-medium tracking-[-0.03em]">
            Encode <span className="italic-display text-tp-muted">a folder.</span>
            <br />
            Decode it back.
            <br />
            <span className="text-tp-muted">Ship the image.</span>
          </h2>
          <p className="max-w-lg text-[15px] leading-relaxed text-tp-muted">
            No servers, no daemons, no schema. The library is the contract. Encode in Node, decode
            in the browser. Or the other way around. Same bytes.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="group inline-flex items-center gap-2 rounded-md bg-tp-accent px-5 py-2.5 text-[14px] font-medium text-tp-accent-fg transition-transform hover:-translate-y-px"
              href="/docs/quickstart"
            >
              Run the quickstart
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-tp-border bg-tp-elev px-5 py-2.5 text-[14px] font-medium text-tp-fg transition-colors hover:border-tp-fg/40"
              href="/docs/api"
            >
              Read the concepts
            </Link>
            <a
              className="ml-1 text-[13px] text-tp-muted hover:text-tp-fg"
              href="https://github.com/anthropics/codeart"
            >
              Source →
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-3 rounded-xl bg-tp-accent/10 blur-2xl" />
          <div className="relative">
            <CodeBlock code={SNIPPET} label="quickstart.ts · roundtrip" lang="ts" />
          </div>
        </div>
      </div>
    </section>
  )
}
