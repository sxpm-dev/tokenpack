'use client'

import { Surface, Table } from '@heroui/react'
import { CheckCircleIcon, WarningCircleIcon, XCircleIcon } from '@phosphor-icons/react'

import { COLORS } from '../constants'

type Compat = 'full' | 'partial' | 'none'

interface ScenarioConfig {
  scenario: string
  codec: string
  compression: string
  surface: string
  bpp: number | string
  streaming: boolean
  /**
   * Browser-decode compatibility:
   *   full    — works in all modern browsers (≥ 95% of users) once compressors
   *             use `DecompressionStream`.
   *   partial — works in browsers that ship `DecompressionStream('br')`
   *             (Chromium ≥ 122, Firefox ≥ 126, Safari ≥ 18 — ~90% of users).
   *             Older browsers need a JS brotli polyfill (~50 KB).
   *   none    — image format isn't broadly supported (none in the current set).
   */
  compat: Compat
  compatNote: string
}

const SCENARIO_CONFIGS: ScenarioConfig[] = [
  {
    scenario: 'max-webp3',
    codec: 'linear',
    compression: 'brotli-11',
    surface: 'webp',
    bpp: 3,
    streaming: false,
    compat: 'partial',
    compatNote:
      'WebP read: universal. Brotli-11 needs DecompressionStream("br") (Chromium ≥ 122, Firefox ≥ 126, Safari ≥ 18) or a JS brotli polyfill.',
  },
  {
    scenario: 'max-png3',
    codec: 'linear',
    compression: 'brotli-11',
    surface: 'png',
    bpp: 3,
    streaming: false,
    compat: 'partial',
    compatNote: 'PNG read: universal. Brotli-11 same caveat as above.',
  },
  {
    scenario: 'max-png4',
    codec: 'linear',
    compression: 'brotli-11',
    surface: 'png',
    bpp: 4,
    streaming: false,
    compat: 'partial',
    compatNote: 'PNG read: universal. Brotli-11 same caveat. bpp=4 keeps the alpha channel.',
  },
  {
    scenario: 'stream-png3',
    codec: 'linear',
    compression: 'brotli-6',
    surface: 'png',
    bpp: 3,
    streaming: true,
    compat: 'partial',
    compatNote:
      'PNG with small IDAT chunks (streaming-friendly). Brotli-6 same browser caveat as brotli-11.',
  },
  {
    scenario: 'stream-png4',
    codec: 'linear',
    compression: 'brotli-6',
    surface: 'png',
    bpp: 4,
    streaming: true,
    compat: 'partial',
    compatNote: 'Streaming PNG, bpp=4 (alpha preserved). Brotli-6 — partial browser support.',
  },
  {
    scenario: 'stream-def3',
    codec: 'linear',
    compression: 'deflate-6',
    surface: 'png',
    bpp: 3,
    streaming: true,
    compat: 'full',
    compatNote:
      'Universal: PNG read everywhere; DecompressionStream("deflate") supported in Chrome ≥ 80, Safari ≥ 16.4, Firefox ≥ 113.',
  },
  {
    scenario: 'stream-def4',
    codec: 'linear',
    compression: 'deflate-6',
    surface: 'png',
    bpp: 4,
    streaming: true,
    compat: 'full',
    compatNote: 'Universal: same as stream-def3 with alpha channel.',
  },
]

function CompatBadge({ compat, note }: { compat: Compat; note: string }) {
  if (compat === 'full') {
    return (
      <span
        aria-label={note}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-widest bg-green-500/15 text-green-300"
        title={note}
      >
        <CheckCircleIcon size={11} weight="fill" /> Full
      </span>
    )
  }
  if (compat === 'partial') {
    return (
      <span
        aria-label={note}
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-widest bg-yellow-500/15 text-yellow-300"
        title={note}
      >
        <WarningCircleIcon size={11} weight="fill" /> Partial
      </span>
    )
  }

  return (
    <span
      aria-label={note}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-widest bg-red-500/15 text-red-300"
      title={note}
    >
      <XCircleIcon size={11} weight="fill" /> None
    </span>
  )
}

export function ScenarioConfigTable() {
  return (
    <Surface className="rounded-2xl p-3.5 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[10px] text-white/30 uppercase tracking-widest">Token configs</div>
        <div className="text-[11px] text-white/40">
          All scenarios use the <span className="font-mono text-white/60">linear</span> codec +{' '}
          <span className="font-mono text-white/60">dense</span> drawer.
        </div>
      </div>

      <Table aria-label="Token configs and browser-decode compatibility">
        <Table.Content>
          <Table.Header>
            <Table.Column id="scenario">Scenario</Table.Column>
            <Table.Column id="compression">Compression</Table.Column>
            <Table.Column id="surface">Surface</Table.Column>
            <Table.Column id="bpp">bpp</Table.Column>
            <Table.Column id="streaming">Streaming</Table.Column>
            <Table.Column id="compat">Browser decode</Table.Column>
          </Table.Header>
          <Table.Body>
            {SCENARIO_CONFIGS.map(c => (
              <Table.Row key={c.scenario} id={c.scenario}>
                <Table.Cell>
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: COLORS[c.scenario] ?? '#888' }}
                    />
                    <span className="font-mono text-white/85">{c.scenario}</span>
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-white/70">{c.compression}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-white/70">{c.surface}</span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-white/70">{c.bpp}</span>
                </Table.Cell>
                <Table.Cell>
                  {c.streaming ? (
                    <span className="text-green-400 text-[11px] uppercase tracking-widest">
                      yes
                    </span>
                  ) : (
                    <span className="text-white/30 text-[11px] uppercase tracking-widest">no</span>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <CompatBadge compat={c.compat} note={c.compatNote} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table>

      <div className="text-[11px] leading-5 text-white/40 space-y-1 pt-1 border-t border-white/5">
        <div>
          <span className="text-green-400 font-semibold">Full</span> — works in all modern browsers
          via <code className="text-white/60">DecompressionStream(&quot;deflate&quot;)</code>{' '}
          (Chrome ≥ 80, Safari ≥ 16.4, Firefox ≥ 113).
        </div>
        <div>
          <span className="text-yellow-400 font-semibold">Partial</span> — needs{' '}
          <code className="text-white/60">DecompressionStream(&quot;br&quot;)</code> (Chromium ≥
          122, Firefox ≥ 126, Safari ≥ 18 — ~90% of users today). Older browsers need a brotli WASM
          polyfill (~50&nbsp;KB).
        </div>
        <div className="pt-1 text-white/30">
          Today <code className="text-white/40">@tokenpack/browser</code> uses Node{' '}
          <code>zlib</code> via the bundler&apos;s polyfill. The async-compressor refactor (tracked
          in IDEAS.md) switches to native <code>DecompressionStream</code> when present and falls
          back to WASM otherwise.
        </div>
      </div>
    </Surface>
  )
}
