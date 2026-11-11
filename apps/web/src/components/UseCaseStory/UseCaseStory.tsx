import Link from 'next/link'
import type { ReactNode } from 'react'

import { CodeBlock } from '@/components/CodeBlock/CodeBlock'

export interface StoryChapter {
  /** Section index like "01", "02". Pure visual marker. */
  n: string
  /** Section tag — short, ALL CAPS-ish, e.g. "The problem". */
  tag: string
  /** The chapter's heading. */
  heading: ReactNode
  /** Optional sub-heading / lede paragraph. */
  lede?: ReactNode
  /** Long-form body content (prose, lists, comparisons). */
  body: ReactNode
  /** Diagram or other visual to anchor the chapter. */
  visual?: ReactNode
  /** When true, places the visual *before* the body. */
  visualFirst?: boolean
}

export interface UseCaseStoryProps {
  /** Index label like "05" — purely visual. */
  index: string
  /** Tag pill at the top of the hero. */
  tag: string
  /** Main hero headline. */
  title: ReactNode
  /** Hero sub-line — should set the stakes in one sentence. */
  tagline: ReactNode
  /** Who this is for (short pill row). */
  audience?: string[]
  /** Story chapters, in order. */
  chapters: StoryChapter[]
  /** Optional API/code section (rendered after the chapters). */
  code?: {
    label: string
    code: string
  }
  /** Optional "in one line" final tagline rendered above the next-up link. */
  closing?: ReactNode
  /** Next use case to link to. */
  nextUseCase?: { href: string; label: string }
}

export async function UseCaseStory(props: UseCaseStoryProps) {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-tp-border">
        <div className="absolute inset-0 tp-grid-fade" />
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16">
          <div className="mb-6 flex items-baseline justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-tp-soft">{props.index}</span>
              <span className="rounded-full border border-tp-border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-tp-muted uppercase">
                {props.tag}
              </span>
            </div>
            <Link className="text-[12px] text-tp-muted hover:text-tp-fg" href="/use-cases">
              ← All use cases
            </Link>
          </div>
          <h1 className="max-w-3xl text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.04] font-medium tracking-[-0.03em]">
            {props.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-tp-muted">
            {props.tagline}
          </p>
          {props.audience && props.audience.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-2 text-[11px]">
              {props.audience.map(a => (
                <li
                  key={a}
                  className="rounded-full border border-tp-border bg-tp-elev px-3 py-1 font-mono tracking-[0.06em] text-tp-muted"
                >
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Chapters */}
      <div className="border-b border-tp-border">
        {props.chapters.map((chapter, idx) => (
          <Chapter key={chapter.n} alternate={idx % 2 === 1} chapter={chapter} />
        ))}
      </div>

      {/* Code section */}
      {props.code && (
        <section className="border-b border-tp-border">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § In code
            </div>
            <h2 className="mb-8 max-w-3xl text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.1] font-medium tracking-[-0.025em]">
              The whole protocol.
            </h2>
            <CodeBlock code={props.code.code} label={props.code.label} lang="ts" />
          </div>
        </section>
      )}

      {/* Closing */}
      {(props.closing || props.nextUseCase) && (
        <section>
          <div className="mx-auto max-w-5xl px-6 py-20">
            {props.closing && (
              <p className="mb-8 max-w-2xl text-[clamp(1.2rem,2vw,1.6rem)] leading-[1.25] font-medium tracking-[-0.015em] text-tp-fg">
                {props.closing}
              </p>
            )}
            {props.nextUseCase && (
              <Link
                className="group inline-flex items-center gap-2 rounded-md border border-tp-border bg-tp-elev px-5 py-3 text-[14px] text-tp-fg hover:border-tp-fg/40"
                href={props.nextUseCase.href}
              >
                <span className="text-tp-muted">Next use case</span>
                <span>{props.nextUseCase.label}</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  )
}

interface ChapterProps {
  chapter: StoryChapter
  alternate: boolean
}

function Chapter({ chapter, alternate }: ChapterProps) {
  const visualSlot = chapter.visual ? (
    <div className="overflow-hidden rounded-lg border border-tp-border bg-tp-bg p-4">
      {chapter.visual}
    </div>
  ) : null

  return (
    <section
      className={`border-b border-tp-border last:border-b-0 ${alternate ? 'bg-tp-elev2' : ''}`}
    >
      <div className="mx-auto max-w-5xl px-6 py-20">
        <header className="mb-10 flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[12px] text-tp-soft">{chapter.n}</span>
            <span className="rounded-full border border-tp-border bg-tp-bg px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-tp-muted uppercase">
              {chapter.tag}
            </span>
            <span className="h-px flex-1 bg-tp-border" />
          </div>
          <h2 className="max-w-3xl text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.1] font-medium tracking-[-0.025em]">
            {chapter.heading}
          </h2>
          {chapter.lede && (
            <p className="max-w-2xl text-[15px] leading-relaxed text-tp-muted">{chapter.lede}</p>
          )}
        </header>

        <div className="flex flex-col gap-10">
          {chapter.visualFirst && visualSlot}
          <div className="prose prose-tp max-w-3xl text-[14.5px] leading-relaxed text-tp-muted">
            {chapter.body}
          </div>
          {!chapter.visualFirst && visualSlot}
        </div>
      </div>
    </section>
  )
}
