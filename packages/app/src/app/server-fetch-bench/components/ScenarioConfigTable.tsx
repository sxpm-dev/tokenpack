'use client'

import '@tokenpack/browser'

import { Surface, Table } from '@heroui/react'
import { CheckCircleIcon, WarningCircleIcon, XCircleIcon } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'

import { ARCHIVE_SCENARIOS, buildScenarioConfig } from '../constants'

type Compat = 'full' | 'partial' | 'none'

interface ScenarioConfig {
  scenario: string
  codec: string
  compression: string
  surface: string
  bpp: number | string
  streaming: boolean
  compat: Compat
  compatNote: string
}

interface ScenarioConfigTableProps {
  scenarioIds: ReadonlyArray<string>
}

interface CodecLike {
  name: string
}

interface SurfaceLike {
  id: string
}

function buildConfigs(scenarioIds: ReadonlyArray<string>): ScenarioConfig[] {
  const out: ScenarioConfig[] = []
  const ctorByName = new Map(algorithmCatalog.list().map(C => [C.name, C]))

  for (const id of scenarioIds) {
    if (ARCHIVE_SCENARIOS.includes(id)) continue
    // scenario id format: `<algoName>-c<channels>` (see benchmark/run.ts).
    const m = id.match(/^(.+)-c(\d+)$/)

    if (!m) continue
    const [, algoName, chStr] = m
    const Ctor = ctorByName.get(algoName)

    if (!Ctor) continue
    const codec = new (Ctor.Codec as unknown as new () => CodecLike)()
    const surface = new (Ctor.Surface as unknown as new () => SurfaceLike)()
    const compressorFamily = (Ctor.Compressor as unknown as { familyId: string }).familyId
    const streamable = Ctor.capabilities.streamable

    const compat: Compat = compressorFamily === 'brotli' ? 'partial' : 'full'
    const compatNote =
      compressorFamily === 'brotli'
        ? `${algoName}: outer compression is brotli — needs DecompressionStream("br") (Chromium ≥ 124, Firefox ≥ 126, Safari ≥ 18). Older browsers need a brotli WASM polyfill.`
        : `${algoName}: ${compressorFamily} outer compression — works in every shipping browser via native DecompressionStream.`

    out.push({
      scenario: id,
      codec: codec.name,
      compression: compressorFamily,
      surface: surface.id,
      bpp: chStr,
      streaming: streamable,
      compat,
      compatNote,
    })
  }

  return out
}

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

export function ScenarioConfigTable({ scenarioIds }: ScenarioConfigTableProps) {
  const { colors } = useMemo(() => buildScenarioConfig(scenarioIds), [scenarioIds])
  const configs = useMemo(() => buildConfigs(scenarioIds), [scenarioIds])

  if (configs.length === 0) {
    return (
      <Surface className="rounded-2xl p-3.5 text-[11px] text-white/40">
        No token scenarios in the current results — only archive baselines.
      </Surface>
    )
  }

  return (
    <Surface className="rounded-2xl p-3.5 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[10px] text-white/30 uppercase tracking-widest">Token configs</div>
        <div className="text-[11px] text-white/40">
          One row per <span className="font-mono text-white/60">{'<algorithm>-c<channels>'}</span>{' '}
          scenario the benchmark generated.
        </div>
      </div>

      <Table aria-label="Token configs and browser-decode compatibility">
        <Table.Content>
          <Table.Header>
            <Table.Column id="scenario">Scenario</Table.Column>
            <Table.Column id="codec">Codec</Table.Column>
            <Table.Column id="compression">Compressor</Table.Column>
            <Table.Column id="surface">Surface</Table.Column>
            <Table.Column id="bpp">bpp</Table.Column>
            <Table.Column id="streaming">Streaming</Table.Column>
            <Table.Column id="compat">Browser decode</Table.Column>
          </Table.Header>
          <Table.Body>
            {configs.map(c => (
              <Table.Row key={c.scenario} id={c.scenario}>
                <Table.Cell>
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: colors[c.scenario] ?? '#888' }}
                    />
                    <span className="font-mono text-white/85">{c.scenario}</span>
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="font-mono text-white/70">{c.codec}</span>
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
          124, Firefox ≥ 126, Safari ≥ 18 — ~90% of users today). Older browsers need a brotli WASM
          polyfill (~50&nbsp;KB).
        </div>
      </div>
    </Surface>
  )
}
