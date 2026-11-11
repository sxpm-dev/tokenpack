import { HeroDemo } from '@/components/Hero/HeroDemo'

export async function EncodeShapes() {
  return (
    <section className="border-b border-tp-border">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <article className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[12px] text-tp-soft">01</span>
              <span className="rounded-full border border-tp-border bg-tp-elev px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-tp-muted uppercase">
                Encode
              </span>
              <span className="h-px flex-1 bg-tp-border" />
            </div>

            <h2 className="max-w-3xl text-[clamp(1.9rem,4vw,3.2rem)] leading-[1.05] font-medium tracking-[-0.02em]">
              encode(input) → Image Token.
            </h2>

            <p className="max-w-4xl text-[15px] leading-relaxed text-tp-muted">
              Turn a string, a file pack, or a routed bundle into a portable image token. The same
              API can emit tiny one-off payloads, multi-file packs, or manifest + chunk tokens for
              larger apps.
            </p>
          </header>

          <HeroDemo />
        </article>
      </div>
    </section>
  )
}
