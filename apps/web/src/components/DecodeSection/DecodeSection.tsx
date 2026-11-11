import Link from 'next/link'

import { DecodeBlock } from '@/components/HowItWorks/DecodeBlock'

export async function DecodeSection() {
  return (
    <section className="border-b border-tp-border">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <article className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[12px] text-tp-soft">02</span>
              <span className="rounded-full border border-tp-border bg-tp-elev px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-tp-muted uppercase">
                Decode
              </span>
              <span className="h-px flex-1 bg-tp-border" />
            </div>

            <h2 className="max-w-3xl text-[clamp(1.9rem,4vw,3.2rem)] leading-[1.05] font-medium tracking-[-0.02em]">
              decode(image) → Pack.
            </h2>

            <p className="max-w-4xl text-[15px] leading-relaxed text-tp-muted">
              Hand decode() any image source — URL, Blob, Buffer, ArrayBuffer, ImageBitmap, even an
              &lt;img&gt; already in the DOM. The result is a Pack: text() / json() / list() /
              bytes() read your data directly. For router tokens, use decodeRouter() — it gives you
              list / materialize / stream over chunks.
            </p>
          </header>

          <DecodeBlock />

          <p className="text-center font-mono text-[11px] text-tp-soft">
            Same API in{' '}
            <Link
              className="text-tp-fg underline decoration-tp-border underline-offset-4 transition-colors hover:decoration-tp-accent"
              href="/docs/api/node"
            >
              @tokenpack/node
            </Link>{' '}
            and{' '}
            <Link
              className="text-tp-fg underline decoration-tp-border underline-offset-4 transition-colors hover:decoration-tp-accent"
              href="/docs/api/browser"
            >
              @tokenpack/browser
            </Link>
            .
          </p>
        </article>
      </div>
    </section>
  )
}
