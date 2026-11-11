import Link from 'next/link'
import type { ReactNode } from 'react'

import { CodeBlock } from '@/components/CodeBlock/CodeBlock'

export interface UseCaseStep {
  label: string
  detail: string
}

export interface UseCaseCompare {
  title: string
  rows: { label: string; value: string; tone?: 'good' | 'bad' | 'neutral' }[]
}

export interface UseCaseSection {
  kicker: string
  title: ReactNode
  body: ReactNode
}

export interface UseCasePageProps {
  index: string
  tag: string
  title: ReactNode
  problem: ReactNode
  audience: { who: string; pain: string }[]
  /** Optional rough-sketch diagram rendered next to the problem statement. */
  heroDiagram?: ReactNode
  solutionTitle: ReactNode
  solutionBody: ReactNode
  solutionSteps: UseCaseStep[]
  /** Optional rough-sketch diagram rendered above the before/after compare. */
  solutionDiagram?: ReactNode
  comparisons: [UseCaseCompare, UseCaseCompare]
  codeLabel: string
  code: string
  closingTitle: ReactNode
  closingBody: ReactNode
  nextUseCase: { href: string; label: string }
}

export async function UseCasePage(props: UseCasePageProps) {
  return (
    <article>
      {/* Hero — Problem framing */}
      <section className="relative overflow-hidden border-b border-tp-border">
        <div className="absolute inset-0 tp-grid-fade" />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-24">
          <div className="mb-6 flex items-center gap-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            <Link className="hover:text-tp-fg" href="/use-cases">
              ← Use cases
            </Link>
            <span className="font-mono text-tp-soft">/ {props.index}</span>
            <span className="rounded-full border border-tp-border bg-tp-elev px-3 py-1">
              {props.tag}
            </span>
          </div>

          <h1 className="max-w-4xl text-[clamp(2.4rem,5vw,4rem)] leading-[1.02] font-medium tracking-[-0.035em]">
            {props.title}
          </h1>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
                § Problem
              </div>
              <div className="text-[15.5px] leading-relaxed text-tp-muted [&_p+p]:mt-4 [&_strong]:font-medium [&_strong]:text-tp-fg">
                {props.problem}
              </div>
            </div>
            <aside className="flex flex-col gap-5">
              {props.heroDiagram && (
                <div className="rounded-lg border border-tp-border bg-tp-elev p-4">
                  {props.heroDiagram}
                </div>
              )}
              <div className="rounded-lg border border-tp-border bg-tp-elev p-5">
                <div className="mb-3 text-[10px] tracking-[0.18em] text-tp-muted uppercase">
                  Who feels it
                </div>
                <ul className="divide-y divide-tp-border">
                  {props.audience.map(a => (
                    <li key={a.who} className="py-3 first:pt-0 last:pb-0">
                      <div className="font-mono text-[12px] text-tp-fg">{a.who}</div>
                      <div className="text-[12.5px] text-tp-muted">{a.pain}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="border-b border-tp-border bg-tp-elev2">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § Solution
          </div>
          <h2 className="max-w-3xl text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
            {props.solutionTitle}
          </h2>
          <div className="mt-5 max-w-3xl text-[15px] leading-relaxed text-tp-muted [&_p+p]:mt-4 [&_strong]:font-medium [&_strong]:text-tp-fg">
            {props.solutionBody}
          </div>

          <ol className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border md:grid-cols-2 lg:grid-cols-4">
            {props.solutionSteps.map((step, idx) => (
              <li key={idx} className="bg-tp-bg p-5">
                <div className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
                  step {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="mt-2 text-[14px] font-medium text-tp-fg">{step.label}</div>
                <div className="mt-1 text-[12.5px] leading-relaxed text-tp-muted">
                  {step.detail}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Before / After */}
      <section className="border-b border-tp-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § Before vs. after
          </div>
          <h2 className="max-w-3xl text-[clamp(1.5rem,2.5vw,2.25rem)] leading-[1.05] font-medium tracking-[-0.025em]">
            What changes for the consumer.
          </h2>

          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border lg:grid-cols-2">
            <CompareCard accent={false} compare={props.comparisons[0]} />
            <CompareCard accent compare={props.comparisons[1]} />
          </div>
        </div>
      </section>

      {/* Code */}
      <section className="border-b border-tp-border bg-tp-elev2">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § In code
          </div>
          <h2 className="max-w-3xl text-[clamp(1.5rem,2.5vw,2.25rem)] leading-[1.05] font-medium tracking-[-0.025em]">
            <span className="italic-display text-tp-muted">Concretely,</span> it looks like this.
          </h2>
          <div className="mt-6">
            <CodeBlock
              code={props.code}
              label={props.codeLabel}
              lang="ts"
              tag="copy · paste · ship"
            />
          </div>
        </div>
      </section>

      {/* Close + nav */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § Takeaway
          </div>
          <h2 className="max-w-3xl text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.03em]">
            {props.closingTitle}
          </h2>
          <div className="mt-4 max-w-3xl text-[15px] leading-relaxed text-tp-muted [&_p+p]:mt-4 [&_strong]:font-medium [&_strong]:text-tp-fg">
            {props.closingBody}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              className="group inline-flex items-center gap-2 rounded-md bg-tp-fg px-5 py-2.5 text-[14px] font-medium text-tp-bg hover:-translate-y-px transition-transform"
              href="/docs/quickstart"
            >
              Try the quickstart
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-tp-border bg-tp-elev px-5 py-2.5 text-[14px] font-medium text-tp-fg hover:border-tp-fg/40"
              href="/playground"
            >
              Live playground
            </Link>
            <Link
              className="ml-auto text-[13px] text-tp-muted hover:text-tp-fg"
              href={props.nextUseCase.href}
            >
              Next: {props.nextUseCase.label} →
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}

interface CompareCardProps {
  compare: UseCaseCompare
  accent: boolean
}

function CompareCard({ compare, accent }: CompareCardProps) {
  return (
    <div className={`bg-tp-bg p-6 ${accent ? 'lg:bg-tp-mark/5' : ''}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-medium tracking-tight">{compare.title}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-[0.1em] uppercase ${
            accent
              ? 'border border-tp-accent/40 bg-tp-accent/10 text-tp-accent'
              : 'border border-tp-border text-tp-muted'
          }`}
        >
          {accent ? 'with TokenPack' : 'today'}
        </span>
      </div>
      <dl className="space-y-3">
        {compare.rows.map(row => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="font-mono text-[10.5px] tracking-[0.1em] text-tp-soft uppercase">
              {row.label}
            </dt>
            <dd
              className={`text-right text-[13px] ${
                row.tone === 'good'
                  ? 'text-tp-accent'
                  : row.tone === 'bad'
                    ? 'text-tp-muted line-through decoration-tp-soft'
                    : 'text-tp-fg'
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
