import {
  LinearVisual,
  PixelByteCallout,
  PixelRangeVisual,
  TpakBytesCallout,
} from '@/components/HowItWorks/AlgorithmComparison'

export function AlgorithmFamilies() {
  return (
    <section className="border-b border-tp-border">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <header className="mb-12 flex flex-col gap-3">
          <div className="text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § How it works?
          </div>
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
            Two ways to put bytes{' '}
            <span className="italic-display text-tp-muted">into an Image Token.</span>
          </h2>
        </header>

        <div className="grid grid-rows-[auto_auto_1fr_auto] gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border lg:grid-cols-2">
          <FamilyCard
            bullets={[
              <>
                Stores data in pixels. Each pixel has{' '}
                <strong className="text-tp-fg">4 RGBA channels</strong> — 4 bytes of payload.
              </>,
              <>Available for fetch and stream + decode on the fly.</>,
              <>
                Compression size: <strong className="text-tp-fg">~90%</strong>.
              </>,
            ]}
            callout={<PixelByteCallout />}
            title="linear-deflate"
            visual={<LinearVisual />}
          />
          <FamilyCard
            bullets={[
              <>
                Stores data in the <code className="font-mono text-tp-fg">tpAK</code> payload —
                pixels are decoration.
              </>,
              <>
                Available for fetch, stream + decode on the fly, and{' '}
                <strong className="text-tp-fg">partial fetch via HTTP Range</strong>.
              </>,
              <>
                Compression size: <strong className="text-tp-fg">~90%</strong>.
              </>,
            ]}
            callout={<TpakBytesCallout />}
            title="pixel-range"
            visual={<PixelRangeVisual />}
          />
        </div>
      </div>
    </section>
  )
}

interface FamilyCardProps {
  title: string
  visual: React.ReactNode
  callout: React.ReactNode
  bullets: React.ReactNode[]
}

function FamilyCard({ title, visual, callout, bullets }: FamilyCardProps) {
  return (
    <div className="row-span-4 grid grid-rows-subgrid gap-6 bg-tp-bg p-8">
      <div className="font-mono text-[15px] font-medium tracking-tight text-tp-fg">{title}</div>

      <div className="flex min-h-[150px] items-center justify-center">
        <div className="mx-auto w-full max-w-[320px]">{visual}</div>
      </div>
      <div className="flex items-start justify-center">{callout}</div>

      <ul className="flex flex-col gap-2 text-[13.5px] leading-relaxed text-tp-muted">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden="true" className="font-mono text-tp-accent">
              +
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
