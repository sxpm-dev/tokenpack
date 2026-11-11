'use client'

import { useState } from 'react'

import { FLOWS, FlowSvg } from '@/components/Rough/ApiFlowDiagrams'

const TAB_FLOW_NUMBERS = ['01', '02', '03', '04', '05', '06']
const FLOWS_BY_NUMBER = FLOWS.filter(flow => TAB_FLOW_NUMBERS.includes(flow.n))
const TAB_TITLES: Record<string, string> = {
  '01': 'List',
  '02': 'JSON file',
  '03': 'Text file',
  '04': 'Split file',
  '05': 'Multi-range',
  '06': 'Cross-chunk',
}

function highlightCode(value: string) {
  const parts = value.split(
    /(await|router|GET|Range|bytes|chunk-\d+\.png|'[^']+'|\[[^\]]+\]|\bjson\b|\btext\b|\blist\b|\bmaterialize\b)/g,
  )

  return parts.map((part, index) => {
    if (part === 'await' || part === 'GET') {
      return (
        <span key={`${part}-${index}`} className="text-[#ff7b72]">
          {part}
        </span>
      )
    }

    if (part === 'router' || part === 'Range' || part === 'bytes') {
      return (
        <span key={`${part}-${index}`} className="text-[#79c0ff]">
          {part}
        </span>
      )
    }

    if (part.startsWith('chunk-') || part.startsWith("'") || part.startsWith('[')) {
      return (
        <span key={`${part}-${index}`} className="text-[#a5d6ff]">
          {part}
        </span>
      )
    }

    if (['json', 'text', 'list', 'materialize'].includes(part)) {
      return (
        <span key={`${part}-${index}`} className="text-tp-accent">
          {part}
        </span>
      )
    }

    return part
  })
}

export function RangeFetchTabs() {
  const [activeN, setActiveN] = useState('02')
  const active = FLOWS_BY_NUMBER.find(flow => flow.n === activeN) ?? FLOWS_BY_NUMBER[0]
  const activeTitle = TAB_TITLES[active.n] ?? active.title

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {FLOWS_BY_NUMBER.map(flow => {
          const selected = flow.n === active.n
          const tabTitle = TAB_TITLES[flow.n] ?? flow.title

          return (
            <button
              key={flow.n}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                selected
                  ? 'border-tp-accent bg-tp-accent text-tp-accent-fg'
                  : 'border-tp-border bg-tp-elev text-tp-muted hover:text-tp-fg'
              }`}
              type="button"
              onClick={() => setActiveN(flow.n)}
            >
              {flow.n} · {tabTitle}
            </button>
          )
        })}
      </div>

      <article className="grid gap-5 overflow-hidden rounded-lg border border-tp-border bg-tp-elev2 p-5 lg:p-6">
        <header className="max-w-4xl">
          <div>
            <div className="mb-2 font-mono text-[11px] text-tp-soft">{active.n}</div>
            <h3 className="text-[18px] leading-tight font-medium tracking-tight">{activeTitle}</h3>
          </div>
          <p className="mt-4 text-[13.5px] leading-relaxed text-tp-muted">{active.blurb}</p>
        </header>

        <div className="rounded-md border border-tp-border bg-tp-bg p-3">
          <FlowSvg flow={active} />
        </div>

        <div className="grid gap-px overflow-hidden rounded-md border border-tp-border bg-tp-border lg:grid-cols-[0.85fr_1.15fr]">
          <div className="bg-tp-bg">
            <div className="border-b border-tp-border px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
              Code
            </div>
            <code className="block overflow-hidden break-words p-4 font-mono text-[12px] leading-relaxed text-tp-fg">
              {highlightCode(active.call)}
            </code>
          </div>

          <div className="bg-tp-bg">
            <div className="border-b border-tp-border px-4 py-2.5 font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
              Requests
            </div>
            <code className="grid gap-1 overflow-hidden break-words p-4 font-mono text-[12px] leading-relaxed text-tp-fg">
              {active.requests.map(request => (
                <span key={request.http}>
                  {highlightCode(request.http)}
                  {request.note && <span className="text-tp-soft">{` // ${request.note}`}</span>}
                </span>
              ))}
            </code>
          </div>
        </div>
      </article>
    </div>
  )
}
