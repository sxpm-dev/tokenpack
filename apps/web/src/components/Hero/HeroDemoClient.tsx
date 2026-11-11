'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface HeroDemoTab {
  id: string
  label: string
  description: React.ReactNode
  codeNode: React.ReactNode
  visual: React.ReactNode
}

interface Props {
  tabs: HeroDemoTab[]
}

export function HeroDemoClient({ tabs }: Props) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '')

  return (
    <div className="flex flex-col items-stretch gap-8">
      {/* Tabs — segmented control, clearer affordance */}
      <div
        aria-label="Choose an encode shape"
        className="mx-auto inline-flex rounded-full border border-tp-border bg-tp-elev p-1 shadow-sm"
        role="tablist"
      >
        {tabs.map(t => {
          const isActive = t.id === activeId

          return (
            <button
              key={t.id}
              aria-selected={isActive}
              className={`rounded-full px-5 py-1.5 font-mono text-[13px] transition-colors ${
                isActive
                  ? 'bg-tp-accent text-tp-accent-fg shadow-sm'
                  : 'text-tp-muted hover:bg-tp-elev2 hover:text-tp-fg'
              }`}
              role="tab"
              type="button"
              onClick={() => setActiveId(t.id)}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Per-tab description — highlighted callout */}
      <div className="mx-auto max-w-3xl">
        {tabs.map(t => (
          <div
            key={`desc-${t.id}`}
            className={
              t.id === activeId
                ? 'block rounded-lg border-l-2 border-tp-accent bg-tp-elev px-5 py-4 text-[14px] leading-relaxed text-tp-muted'
                : 'hidden'
            }
          >
            {t.description}
          </div>
        ))}
      </div>

      {/* code → arrow → visual, no chrome */}
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-10">
        {/* Code panels — only border, no header bar */}
        <div className="min-w-0">
          {tabs.map(t => (
            <div key={`code-${t.id}`} className={t.id === activeId ? 'block min-w-0' : 'hidden'}>
              {t.codeNode}
            </div>
          ))}
        </div>

        {/* Big arrow — graphic, not a label */}
        <div className="flex items-center justify-center text-tp-soft">
          <span className="font-mono text-[40px] leading-none text-tp-accent lg:text-[56px]">
            →
          </span>
        </div>

        {/* Visuals — bare, centered */}
        <div className="flex min-w-0 items-center justify-center">
          {tabs.map(t => (
            <div key={`visual-${t.id}`} className={t.id === activeId ? 'block' : 'hidden'}>
              {t.visual}
            </div>
          ))}
        </div>
      </div>

      {/* Subtle footnote — moved out of the demo card */}
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
    </div>
  )
}
