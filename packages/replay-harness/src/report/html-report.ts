import {
  labelsForReplayTokenVariant,
  pseudocodeForReplayTokenVariant,
  type ReplayPackLoadMode,
} from '../config/token-variants.js'
import { fmtBytes, fmtMs, fmtPct, fmtSign } from '../format.js'
import type {
  AssetMarker,
  ModeStats,
  PhaseRecord,
  PhaseSummary,
  RunRecord,
  RunReport,
  RunSummaryStats,
} from './types.js'

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Stable hash → HSL color. Same packId always gets the same color so a reader
 *  can scan the table and group rows by pack at a glance. */
function packColor(packId: string): string {
  let h = 0

  for (let i = 0; i < packId.length; i++) {
    h = (h * 31 + packId.charCodeAt(i)) >>> 0
  }
  const hue = h % 360

  return `hsl(${hue} 70% 50%)`
}

function variantLabelHtml(variant: {
  algo: string
  channels: 3 | 4
  loadMode: string
  packCompressor: string
}): string {
  const labels = labelsForReplayTokenVariant({
    algo: variant.algo,
    channels: variant.channels,
    loadMode: variant.loadMode as ReplayPackLoadMode,
    packCompressor: variant.packCompressor,
  })

  return `
<div class="variant-meta">
  <span><strong>Family:</strong> ${escape(labels.family)}</span>
  <span><strong>Encoding:</strong> ${escape(labels.encoding)}</span>
  <span><strong>Runtime:</strong> ${escape(labels.runtimePolicy)}</span>
  <span><strong>Transfer:</strong> ${escape(labels.transferStyle)}</span>
</div>`
}

function variantStrategyHtml(variant: {
  loadMode: string
}): string {
  return `
<details class="variant-strategy" open>
  <summary>Selected strategy pseudocode</summary>
  <pre><code>${escape(
    pseudocodeForReplayTokenVariant({
      loadMode: variant.loadMode as ReplayPackLoadMode,
    }),
  )}</code></pre>
</details>`
}

function reportShape(report: RunReport): { label: string; detail: string } {
  const fixture = report.fixture

  if (fixture?.shape === 'bundle-single') {
    return { label: 'Bundle: single token', detail: fixture.id }
  }
  if (fixture?.shape === 'bundle-chunks') {
    return {
      label: `Bundle: ${fixture.chunks ?? '?'} chunks`,
      detail: fixture.id,
    }
  }
  if (fixture?.shape === 'service-groups') {
    return { label: 'Service groups', detail: fixture.id }
  }

  const targetId = report.target.id

  if (targetId.includes('-bundle-20')) {
    return { label: 'Bundle: 20 chunks', detail: `${targetId}-bundle-20` }
  }
  if (targetId.includes('-bundle')) {
    return { label: 'Bundle: single token', detail: `${targetId}-bundle` }
  }

  return { label: 'Service groups', detail: targetId }
}

function phaseBlock(
  label: string,
  p: PhaseSummary,
  tpHarnessRatio: number | null,
  deliveryMode: 'cdp' | 'sw',
): string {
  const cell = (
    s: { avgMs: number; minMs: number; maxMs: number },
    timeouts = 0,
    errors = 0,
  ): string =>
    `avg ${fmtMs(s.avgMs)}<br><span class="dim">(${fmtMs(s.minMs)}–${fmtMs(s.maxMs)})</span>${
      timeouts || errors
        ? `<br><span class="bad">${timeouts ? `${timeouts} timeout${timeouts === 1 ? '' : 's'}` : ''}${timeouts && errors ? ' · ' : ''}${errors ? `${errors} error${errors === 1 ? '' : 's'}` : ''}</span>`
        : ''
    }`
  const delta = (
    d: { durationMs: number; durationPct: number; loadEventMs: number; loadEventPct: number },
    field: 'duration' | 'loadEvent',
  ): string => {
    const ms = field === 'duration' ? d.durationMs : d.loadEventMs
    const pct = field === 'duration' ? d.durationPct : d.loadEventPct

    return `<span class="${ms <= 0 ? 'good' : 'bad'}">${fmtSign(ms)}<br><span class="dim">${fmtPct(pct)}</span></span>`
  }
  const deltaRaw = (ms: number, base: number): string => {
    const pct = base === 0 ? 0 : (ms / base) * 100

    return `<span class="${ms <= 0 ? 'good' : 'bad'}">${fmtSign(ms)}<br><span class="dim">${fmtPct(pct)}</span></span>`
  }
  const tpAvg = p.tokenpack.duration.avgMs
  const blAvg = p.baseline.duration.avgMs
  const blCdpAvg = p.baselineCdp.duration.avgMs
  const showBaselineCdp = deliveryMode !== 'sw'
  const prodRow =
    deliveryMode === 'sw'
      ? `
    <tr class="prod-row">
      <td>SW TP measurement</td>
      <td colspan="3" class="dim">Measured through a browser Service Worker, so no CDP harness projection is applied.</td>
    </tr>`
      : tpHarnessRatio === null || tpAvg === 0
        ? `
    <tr class="prod-row">
      <td>Est. prod TP <span class="dim">(–harness)</span></td>
      <td colspan="5" class="dim">No marker data — re-run with <code>--token-debug</code></td>
    </tr>`
        : (() => {
            const estProd = tpAvg * (1 - tpHarnessRatio)
            const harnessSavedMs = tpAvg - estProd
            const dVsBl = estProd - blAvg
            const dVsBlCdp = estProd - blCdpAvg

            return `
    <tr class="prod-row">
      <td>Est. prod TP <span class="dim">(–harness)</span></td>
      <td>—</td>
      <td>—</td>
      <td class="tp"><strong>${fmtMs(estProd)}</strong><br><span class="dim">−${fmtMs(harnessSavedMs)} harness<br>(${(tpHarnessRatio * 100).toFixed(1)}% of TP)</span></td>
      <td>${deltaRaw(dVsBl, blAvg)}</td>
      <td>${deltaRaw(dVsBlCdp, blCdpAvg)}</td>
    </tr>`
          })()

  if (!showBaselineCdp) {
    return `
<h3>${label}</h3>
<table class="grid">
  <thead>
    <tr>
      <th>Metric</th>
      <th class="bl">Baseline<br><span class="dim">(no intercept)</span></th>
      <th class="tp">TokenPack<br><span class="dim">Service Worker + pack</span></th>
      <th>Δ TP vs BL<br><span class="dim">(prod fairness)</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Total duration</td>
      <td>${cell(p.baseline.duration, p.baseline.timeouts, p.baseline.errors)}</td>
      <td>${cell(p.tokenpack.duration, p.tokenpack.timeouts, p.tokenpack.errors)}</td>
      <td>${delta(p.deltaTpVsBl, 'duration')}</td>
    </tr>
    <tr>
      <td>Load event</td>
      <td>${cell(p.baseline.loadEvent)}</td>
      <td>${cell(p.tokenpack.loadEvent)}</td>
      <td>${delta(p.deltaTpVsBl, 'loadEvent')}</td>
    </tr>
    <tr>
      <td>Coverage (avg)</td>
      <td>—</td>
      <td>served ${Math.round(p.tokenpack.avgServed ?? 0)} · fell-through ${Math.round(p.tokenpack.avgFellThrough ?? 0)}</td>
      <td>—</td>
    </tr>${prodRow}
  </tbody>
</table>`
  }

  return `
<h3>${label}</h3>
<table class="grid">
  <thead>
    <tr>
      <th>Metric</th>
      <th class="bl">Baseline<br><span class="dim">(no intercept)</span></th>
      <th class="bl">Baseline-CDP<br><span class="dim">(intercept + refetch)</span></th>
      <th class="tp">TokenPack<br><span class="dim">intercept + pack</span></th>
      <th>Δ TP vs BL<br><span class="dim">(prod fairness)</span></th>
      <th>Δ TP vs BL-CDP<br><span class="dim">(tech fairness)</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Total duration</td>
      <td>${cell(p.baseline.duration, p.baseline.timeouts, p.baseline.errors)}</td>
      <td>${cell(p.baselineCdp.duration, p.baselineCdp.timeouts, p.baselineCdp.errors)}</td>
      <td>${cell(p.tokenpack.duration, p.tokenpack.timeouts, p.tokenpack.errors)}</td>
      <td>${delta(p.deltaTpVsBl, 'duration')}</td>
      <td>${delta(p.deltaTpVsBlCdp, 'duration')}</td>
    </tr>
    <tr>
      <td>Load event</td>
      <td>${cell(p.baseline.loadEvent)}</td>
      <td>${cell(p.baselineCdp.loadEvent)}</td>
      <td>${cell(p.tokenpack.loadEvent)}</td>
      <td>${delta(p.deltaTpVsBl, 'loadEvent')}</td>
      <td>${delta(p.deltaTpVsBlCdp, 'loadEvent')}</td>
    </tr>
    <tr>
      <td>Coverage (avg)</td>
      <td>—</td>
      <td>served ${Math.round(p.baselineCdp.avgServed ?? 0)} · fell-through ${Math.round(p.baselineCdp.avgFellThrough ?? 0)}</td>
      <td>served ${Math.round(p.tokenpack.avgServed ?? 0)} · fell-through ${Math.round(p.tokenpack.avgFellThrough ?? 0)}</td>
      <td colspan="2">—</td>
    </tr>${prodRow}
  </tbody>
</table>`
}

/** Per-asset TP harness tax as a fraction of TP per-asset total time.
 *  Aggregates across all phases passed in. Returns null if no markers. */
function computeTpHarnessRatio(phases: ReadonlyArray<PhaseRecord>): number | null {
  let totalSum = 0
  let harnessSum = 0

  for (const p of phases) {
    if (p.timedOut || p.error) continue
    if (!p.assetMarkers) continue
    for (const m of p.assetMarkers) {
      if (m.source !== 'pack' || m.totalMs === null || m.totalMs === undefined) continue
      const harness = Math.max(0, m.totalMs - (m.fetchMs ?? 0) - (m.extractMs ?? 0))

      totalSum += m.totalMs
      harnessSum += harness
    }
  }

  return totalSum === 0 ? null : harnessSum / totalSum
}

function statsOf(values: ReadonlyArray<number>): RunSummaryStats {
  if (values.length === 0) return { count: 0, avgMs: 0, minMs: 0, maxMs: 0 }

  return {
    count: values.length,
    avgMs: values.reduce((s, v) => s + v, 0) / values.length,
    minMs: Math.min(...values),
    maxMs: Math.max(...values),
  }
}

function nonNullNumbers(xs: ReadonlyArray<number | null | undefined>): number[] {
  return xs.filter((v): v is number => typeof v === 'number')
}

function avg(xs: ReadonlyArray<number | undefined>): number {
  const ys = xs.filter((v): v is number => v !== undefined)

  return ys.length === 0 ? 0 : ys.reduce((s, v) => s + v, 0) / ys.length
}

function modeStats(phases: ReadonlyArray<PhaseRecord>, withCoverage: boolean): ModeStats {
  const successfulPhases = phases.filter(p => !p.timedOut && !p.error)
  const out: ModeStats = {
    duration: statsOf(successfulPhases.map(p => p.durationMs)),
    loadEvent: statsOf(nonNullNumbers(successfulPhases.map(p => p.loadEventMs))),
    timeouts: phases.filter(p => p.timedOut).length,
    errors: phases.filter(p => p.error && !p.timedOut).length,
  }

  if (withCoverage) {
    out.avgServed = avg(successfulPhases.map(p => p.served))
    out.avgFellThrough = avg(successfulPhases.map(p => p.fellThrough))
  }

  return out
}

function buildPhaseSummary(
  baselinePhases: ReadonlyArray<PhaseRecord>,
  baselineCdpPhases: ReadonlyArray<PhaseRecord>,
  tokenpackPhases: ReadonlyArray<PhaseRecord>,
): PhaseSummary {
  const bl = modeStats(baselinePhases, false)
  const blCdp = modeStats(baselineCdpPhases, true)
  const tp = modeStats(tokenpackPhases, true)

  return {
    baseline: bl,
    baselineCdp: blCdp,
    tokenpack: tp,
    deltaTpVsBl: {
      durationMs: tp.duration.avgMs - bl.duration.avgMs,
      durationPct:
        bl.duration.avgMs === 0
          ? 0
          : ((tp.duration.avgMs - bl.duration.avgMs) / bl.duration.avgMs) * 100,
      loadEventMs: tp.loadEvent.avgMs - bl.loadEvent.avgMs,
      loadEventPct:
        bl.loadEvent.avgMs === 0
          ? 0
          : ((tp.loadEvent.avgMs - bl.loadEvent.avgMs) / bl.loadEvent.avgMs) * 100,
    },
    deltaTpVsBlCdp: {
      durationMs: tp.duration.avgMs - blCdp.duration.avgMs,
      durationPct:
        blCdp.duration.avgMs === 0
          ? 0
          : ((tp.duration.avgMs - blCdp.duration.avgMs) / blCdp.duration.avgMs) * 100,
      loadEventMs: tp.loadEvent.avgMs - blCdp.loadEvent.avgMs,
      loadEventPct:
        blCdp.loadEvent.avgMs === 0
          ? 0
          : ((tp.loadEvent.avgMs - blCdp.loadEvent.avgMs) / blCdp.loadEvent.avgMs) * 100,
    },
  }
}

function iterationsTable(
  rows: ReadonlyArray<RunRecord>,
  hasReload: boolean,
  showBaselineCdp: boolean,
): string {
  const order = { baseline: 0, 'baseline-cdp': 1, tokenpack: 2 } as const
  const byIter = new Map<number, RunRecord[]>()

  for (const r of rows) {
    if (!showBaselineCdp && r.mode === 'baseline-cdp') continue
    const arr = byIter.get(r.iter) ?? []

    arr.push(r)
    byIter.set(r.iter, arr)
  }
  for (const arr of byIter.values()) arr.sort((a, b) => order[a.mode] - order[b.mode])

  const ratioCell = (ms: number, base: number | undefined): string => {
    if (base === undefined || base === 0) return ''
    const ratio = ms / base
    const cls = ratio < 1 ? 'good' : ratio > 1 ? 'bad' : ''

    return `<br><span class="dim ${cls}">${ratio.toFixed(2)}×</span>`
  }

  const phaseTd = (p: PhaseRecord | null | undefined, base: number | undefined): string => {
    if (!p) return '<td>—</td><td>—</td><td>—</td><td>—</td>'
    const status = p.timedOut
      ? '<br><span class="bad">timeout</span>'
      : p.error
        ? '<br><span class="bad">error</span>'
        : ''
    const sanity = sanityInline(p)

    return `<td>${fmtMs(p.durationMs)}${ratioCell(p.durationMs, base)}${status}${sanity}</td><td>${fmtMs(p.loadEventMs)}</td><td>${p.served ?? '—'}</td><td>${p.fellThrough ?? '—'}</td>`
  }

  const tbodies = [...byIter.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) => {
      const baseline = group.find(r => r.mode === 'baseline')
      const baseCold = baseline?.cold.durationMs
      const baseReload = baseline?.reload?.durationMs ?? undefined
      const trs = group
        .map(r => {
          const cls = r.mode === 'tokenpack' ? 'tp' : r.mode === 'baseline-cdp' ? 'bl-cdp' : 'bl'

          return `
    <tr>
      <td>${r.iter}</td>
      <td class="${cls}">${r.mode}${r.tokenVariantId ? `<br><span class="dim">${escape(r.tokenVariantId)}</span>` : ''}</td>
      ${phaseTd(r.cold, baseCold)}
      ${hasReload ? phaseTd(r.reload, baseReload) : ''}
    </tr>`
        })
        .join('')

      return `<tbody class="iter-group">${trs}</tbody>`
    })
    .join('')

  return `
<table class="grid iterations compact">
  <thead>
    <tr>
      <th rowspan="2">Iter</th>
      <th rowspan="2">Mode</th>
      <th colspan="4">Cold phase</th>
      ${hasReload ? '<th colspan="4">Reload phase</th>' : ''}
    </tr>
    <tr>
      <th>Duration<br><span class="dim">(× vs baseline)</span></th><th>Load</th><th>Served</th><th>Fell-thru</th>
      ${hasReload ? '<th>Duration<br><span class="dim">(× vs baseline)</span></th><th>Load</th><th>Served</th><th>Fell-thru</th>' : ''}
    </tr>
  </thead>
  ${tbodies}
</table>`
}

function sanityInline(p: PhaseRecord): string {
  if (!p.sanity) return ''
  const issues =
    (p.sanity.consoleErrors?.length ?? 0) + (p.sanity.pageErrors?.length ?? 0)
  const issueText =
    issues > 0 ? ` · <span class="bad">${issues} console/page issue${issues === 1 ? '' : 's'}</span>` : ''
  const shot = p.sanity.screenshotPath
    ? ` · <a href="${escape(p.sanity.screenshotPath)}">shot</a>`
    : ''

  return `<br><span class="dim">sanity${shot}${issueText}</span>`
}

function sanityGallery(
  rows: ReadonlyArray<RunRecord>,
  hasReload: boolean,
  options: { heading?: boolean } = { heading: true },
): string {
  const items: string[] = []

  for (const r of rows) {
    for (const [kind, phase] of [
      ['cold', r.cold],
      ['reload', r.reload],
    ] as const) {
      if (kind === 'reload' && !hasReload) continue
      if (!phase?.sanity?.screenshotPath) continue
      const title = `${r.iter} · ${r.mode}${r.tokenVariantId ? ` · ${r.tokenVariantId}` : ''} · ${kind}`
      const issueCount =
        (phase.sanity.consoleErrors?.length ?? 0) + (phase.sanity.pageErrors?.length ?? 0)
      const body = phase.sanity.bodyTextSample
        ? `<div class="dim sanity-text">${escape(phase.sanity.bodyTextSample)}</div>`
        : ''

      items.push(`
        <figure class="sanity-card">
          <a href="${escape(phase.sanity.screenshotPath)}"><img src="${escape(phase.sanity.screenshotPath)}" alt="${escape(title)}"></a>
          <figcaption>
            <strong>${escape(title)}</strong>
            <br><span class="dim">${escape(phase.sanity.title ?? '')}${issueCount ? ` · ${issueCount} issue${issueCount === 1 ? '' : 's'}` : ''}</span>
            ${body}
          </figcaption>
        </figure>`)
    }
  }

  if (items.length === 0) return ''

  return `
${options.heading === false ? '' : '<h2>Sanity screenshots</h2>'}
<div class="sanity-grid">
  ${items.join('')}
</div>`
}

function sanityComparisonGallery(
  variantId: string,
  baselineRows: ReadonlyArray<RunRecord>,
  baselineCdpRows: ReadonlyArray<RunRecord>,
  tokenpackRows: ReadonlyArray<RunRecord>,
  hasReload: boolean,
  deliveryMode: 'cdp' | 'sw',
): string {
  const byIter = new Map<number, RunRecord[]>()
  const showBaselineCdp = deliveryMode !== 'sw'

  for (const r of baselineRows) byIter.set(r.iter, [...(byIter.get(r.iter) ?? []), r])
  if (showBaselineCdp) {
    for (const r of baselineCdpRows) byIter.set(r.iter, [...(byIter.get(r.iter) ?? []), r])
  }
  for (const r of tokenpackRows) byIter.set(r.iter, [...(byIter.get(r.iter) ?? []), r])

  const groups = [...byIter.entries()]
    .sort(([a], [b]) => a - b)
    .map(([iter, rows]) => {
      const baseline = rows.find(r => r.mode === 'baseline')
      const baselineCdp = rows.find(r => r.mode === 'baseline-cdp')
      const tokenpack = rows.find(r => r.mode === 'tokenpack' && r.tokenVariantId === variantId)
      const cards: string[] = []

      for (const [kind, phaseGetter] of [
        ['cold', (r: RunRecord) => r.cold],
        ['reload', (r: RunRecord) => r.reload],
      ] as const) {
        if (kind === 'reload' && !hasReload) continue
        cards.push(
          sanityCard(baseline, kind, phaseGetter, 'Baseline'),
          ...(showBaselineCdp
            ? [sanityCard(baselineCdp, kind, phaseGetter, 'Baseline-CDP')]
            : []),
          sanityCard(tokenpack, kind, phaseGetter, variantId),
        )
      }

      const html = cards.filter(Boolean).join('')

      if (!html) return ''

      return `
<section class="sanity-iter">
  <h4>Iteration ${iter}</h4>
  <div class="sanity-grid sanity-grid-compare">${html}</div>
</section>`
    })
    .filter(Boolean)

  if (groups.length === 0) return '<p class="dim">No screenshots recorded.</p>'

  return `
<details class="sanity-details">
  <summary>Sanity screenshots <span class="dim">baseline vs ${escape(variantId)}</span></summary>
  ${groups.join('')}
</details>`
}

function sanityCard(
  row: RunRecord | undefined,
  kind: 'cold' | 'reload',
  phaseGetter: (row: RunRecord) => PhaseRecord | null,
  label: string,
): string {
  if (!row) return ''
  const phase = phaseGetter(row)

  if (!phase?.sanity?.screenshotPath) return ''
  const title = `${label} · ${kind}`
  const issueCount =
    (phase.sanity.consoleErrors?.length ?? 0) + (phase.sanity.pageErrors?.length ?? 0)
  const body = phase.sanity.bodyTextSample
    ? `<div class="dim sanity-text">${escape(phase.sanity.bodyTextSample)}</div>`
    : ''

  return `
    <figure class="sanity-card">
      <a href="${escape(phase.sanity.screenshotPath)}"><img src="${escape(phase.sanity.screenshotPath)}" alt="${escape(title)}"></a>
      <figcaption>
        <strong>${escape(title)}</strong>
        <br><span class="dim">${escape(phase.sanity.title ?? '')}${issueCount ? ` · ${issueCount} issue${issueCount === 1 ? '' : 's'}` : ''}</span>
        ${body}
      </figcaption>
    </figure>`
}

interface PerUrlRow {
  url: string
  packId?: string
  tpFetchMs?: number
  tpObservedMs?: number
  tpPackInitMs?: number
  tpFileFetchMs?: number
  tpExtractMs?: number
  tpTotalMs?: number | null
  tpStatus?: number | null
  tpCacheState?: 'miss' | 'pending' | 'hit'
  /** TokenPack treated this URL as a fall-through. */
  tpFallThrough?: boolean
  /** Distinguished fall-through caused by min-group-size threshold. */
  tpSkippedByThreshold?: boolean
  blFetchMs?: number
  blObservedMs?: number
  blStatus?: number | null
  blBytes?: number | null
  /** True if any baseline marker mentioned this URL. */
  seenInBaseline?: boolean
  /** True if any tokenpack marker mentioned this URL (any source). */
  seenInTokenpack?: boolean
}

interface TabSpec {
  id: string
  label: string
  note?: string
  content: string
}

function safeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '-')
}

function tabbedSection(scope: string, tabs: ReadonlyArray<TabSpec>): string {
  const safeScope = safeId(scope)
  const tabButtons = tabs
    .map((tab, i) => {
      const id = `${safeScope}-${safeId(tab.id)}`

      return `<button type="button" class="tab-button${i === 0 ? ' active' : ''}" data-tab-scope="${safeScope}" data-tab-target="${id}">${escape(tab.label)}${tab.note ? `<br><span class="dim">${escape(tab.note)}</span>` : ''}</button>`
    })
    .join('')
  const tabPanels = tabs
    .map((tab, i) => {
      const id = `${safeScope}-${safeId(tab.id)}`

      return `<section class="tab-panel" data-tab-panel-scope="${safeScope}" data-tab-panel="${id}"${i === 0 ? '' : ' hidden'}>${tab.content}</section>`
    })
    .join('')

  return `
<div class="tabs">
  <div class="tab-list" role="tablist">${tabButtons}</div>
  <div class="tab-panels">${tabPanels}</div>
</div>`
}

function hasUsableMarkers(phase: PhaseRecord | null | undefined): phase is PhaseRecord {
  return Boolean(phase && !phase.timedOut && !phase.error && phase.assetMarkers?.length)
}

function bestRecordWithMarkers(
  rows: ReadonlyArray<RunRecord>,
  phase: 'cold' | 'reload',
): RunRecord | undefined {
  const getPhase = (r: RunRecord): PhaseRecord | null => (phase === 'cold' ? r.cold : r.reload)
  const byDuration = (a: RunRecord, b: RunRecord): number =>
    (getPhase(a)?.durationMs ?? Number.POSITIVE_INFINITY) -
    (getPhase(b)?.durationMs ?? Number.POSITIVE_INFINITY)

  return (
    rows.filter(r => hasUsableMarkers(getPhase(r))).sort(byDuration)[0] ??
    rows
      .filter(r => Boolean(getPhase(r)?.assetMarkers?.length))
      .sort(byDuration)[0] ??
    rows.filter(r => Boolean(getPhase(r))).sort(byDuration)[0] ??
    rows[rows.length - 1]
  )
}

function bestMarkerNote(row: RunRecord | undefined, phase: 'cold' | 'reload'): string {
  const label = phase === 'cold' ? 'cold' : 'warm'
  const recordPhase = row ? (phase === 'cold' ? row.cold : row.reload) : null

  if (!row || !recordPhase) {
    return `best ${label} phase`
  }

  return `best ${label} · iter ${row.iter} · ${fmtMs(recordPhase.durationMs)}`
}

function markerUrlSet(markers: ReadonlyArray<AssetMarker> | undefined): ReadonlySet<string> {
  return new Set(markers?.map(m => m.url) ?? [])
}

function packOptions(markers: ReadonlyArray<AssetMarker> | undefined): Array<{
  packId: string
  count: number
}> {
  const counts = new Map<string, number>()

  for (const m of markers ?? []) {
    if (m.source !== 'pack' || !m.packId) continue
    counts.set(m.packId, (counts.get(m.packId) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([packId, count]) => ({ packId, count }))
    .sort((a, b) => b.count - a.count || a.packId.localeCompare(b.packId))
}

function intervalUnionMs(intervals: ReadonlyArray<readonly [number, number]>): number {
  const sorted = intervals
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort(([a], [b]) => a - b)
  let total = 0
  let currentStart: number | undefined
  let currentEnd: number | undefined

  for (const [start, end] of sorted) {
    if (currentStart === undefined || currentEnd === undefined) {
      currentStart = start
      currentEnd = end
    } else if (start <= currentEnd) {
      currentEnd = Math.max(currentEnd, end)
    } else {
      total += currentEnd - currentStart
      currentStart = start
      currentEnd = end
    }
  }

  if (currentStart !== undefined && currentEnd !== undefined) total += currentEnd - currentStart

  return total
}

function buildDisplaySummaries(report: RunReport): {
  summary: RunReport['summary']
  variantSummaries?: RunReport['variantSummaries']
} {
  const baselineRows = report.iterations.filter(r => r.mode === 'baseline')
  const baselineCdpRows = report.iterations.filter(r => r.mode === 'baseline-cdp')
  const tokenpackRows = report.iterations.filter(r => r.mode === 'tokenpack')
  const primaryVariantId = report.tokenpackVariants?.[0]?.id
  const primaryTokenpackRows = primaryVariantId
    ? tokenpackRows.filter(r => r.tokenVariantId === primaryVariantId)
    : tokenpackRows
  const summary = {
    cold: buildPhaseSummary(
      baselineRows.map(r => r.cold),
      baselineCdpRows.map(r => r.cold),
      primaryTokenpackRows.map(r => r.cold),
    ),
    reload: buildPhaseSummary(
      baselineRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
      baselineCdpRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
      primaryTokenpackRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
    ),
  }

  if (!report.tokenpackVariants) return { summary }

  const variantSummaries = Object.fromEntries(
    report.tokenpackVariants.map(variant => {
      const rows = tokenpackRows.filter(r => r.tokenVariantId === variant.id)

      return [
        variant.id,
        {
          cold: buildPhaseSummary(
            baselineRows.map(r => r.cold),
            baselineCdpRows.map(r => r.cold),
            rows.map(r => r.cold),
          ),
          reload: buildPhaseSummary(
            baselineRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
            baselineCdpRows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
            rows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
          ),
        },
      ]
    }),
  )

  return { summary, variantSummaries }
}

function unifiedAssetTable(
  baselineMarkers: ReadonlyArray<AssetMarker> | undefined,
  tokenpackMarkers: ReadonlyArray<AssetMarker> | undefined,
  deliveryMode: 'cdp' | 'sw',
  comparableUrls?: ReadonlySet<string>,
): string {
  const overheadLabel = deliveryMode === 'sw' ? 'SW overhead' : 'harness IPC tax'
  const overheadTitle =
    deliveryMode === 'sw'
      ? 'Total − (fetch + extract). Service Worker response/message overhead inside the browser.'
      : 'Total − (fetch + extract). Playwright/CDP/page.evaluate/route.fulfill overhead. Zero in a real Service-Worker deployment.'
  const overheadDescription =
    deliveryMode === 'sw'
      ? '<strong>SW overhead</strong> — <code>total − fetch − extract</code>. Browser-side Service Worker response construction and marker-message overhead. No Playwright/CDP fulfill path is included.'
      : '<strong>Harness IPC tax</strong> — <code>total − fetch − extract</code>. Pure overhead from this measurement rig: Playwright routing, <code>page.evaluate</code> CDP roundtrip, browser-to-Node string transfer, <code>route.fulfill</code>, and queueing when many requests fire concurrently. <strong>Zero in a real Service-Worker deployment.</strong>'
  const rows = new Map<string, PerUrlRow>()

  if (tokenpackMarkers) {
    for (const m of tokenpackMarkers) {
      const row = rows.get(m.url) ?? { url: m.url }

      row.seenInTokenpack = true
      if (m.source === 'pack') {
        row.packId = m.packId
        row.tpFetchMs = m.fetchMs
        row.tpObservedMs = m.observedMs
        row.tpPackInitMs = m.packInitMs
        row.tpFileFetchMs = m.fileFetchMs
        row.tpExtractMs = m.extractMs
        row.tpTotalMs = m.totalMs
        row.tpStatus = m.status
        row.tpCacheState = m.cacheState
      } else if (m.source === 'skipped-by-threshold') {
        row.tpSkippedByThreshold = true
        row.tpFallThrough = true
      } else if (m.source === 'fall-through') {
        row.tpFallThrough = true
      }
      rows.set(m.url, row)
    }
  }
  if (baselineMarkers) {
    for (const m of baselineMarkers) {
      const row = rows.get(m.url) ?? { url: m.url }

      row.seenInBaseline = true
      row.blFetchMs = m.fetchMs
      row.blObservedMs = m.observedMs
      row.blStatus = m.status
      row.blBytes = m.bytes
      rows.set(m.url, row)
    }
  }
  if (rows.size === 0) return '<p class="dim">No asset markers (run with --token-debug).</p>'

  const sorted = [...rows.values()].sort((a, b) => {
    const ap = a.packId ? 0 : 1
    const bp = b.packId ? 0 : 1

    if (ap !== bp) return ap - bp
    if (a.packId && b.packId && a.packId !== b.packId) return a.packId.localeCompare(b.packId)

    return a.url.localeCompare(b.url)
  })

  let tpFetchSum = 0
  let tpPackActualInitSum = 0
  let tpPackPendingWaitSum = 0
  let tpPackHitWaitSum = 0
  let tpFileFetchSum = 0
  let tpFetchWaitExcludedSum = 0
  let tpExtractSum = 0
  let tpHarnessSum = 0
  let tpPausedSum = 0
  let tpTotalSum = 0
  let tpFallThroughBlSum = 0 // sum of BL fetch ms for rows TP fell through on
  let blFetchSum = 0
  let blComparableFetchSum = 0
  let bytesSum = 0
  let tpFetchPaidCount = 0
  let tpCacheMissCount = 0
  let tpCachePendingCount = 0
  let tpCacheHitCount = 0
  let tpFallThroughCount = 0
  let blFetchCount = 0
  const tpServedIntervals: Array<readonly [number, number]> = []
  const blComparableIntervals: Array<readonly [number, number]> = []

  for (const r of sorted) {
    const fetchMs = r.tpFetchMs ?? 0
    const packInitMs = r.tpPackInitMs ?? 0
    const fileFetchMs = r.tpFileFetchMs ?? 0
    const fetchWorkMs = r.tpCacheState === 'miss' ? fetchMs : 0
    const fetchWaitMs = r.tpFetchMs === undefined ? 0 : fetchMs - fetchWorkMs

    if (r.tpFetchMs !== undefined) {
      tpFetchSum += fetchWorkMs
      tpFetchWaitExcludedSum += fetchWaitMs
      if (fetchWorkMs > 0) tpFetchPaidCount++
    }
    if (r.tpPackInitMs !== undefined) {
      if (r.tpCacheState === 'miss') tpPackActualInitSum += packInitMs
      else if (r.tpCacheState === 'pending') tpPackPendingWaitSum += packInitMs
      else if (r.tpCacheState === 'hit') tpPackHitWaitSum += packInitMs
    }
    if (r.tpFileFetchMs !== undefined && r.tpCacheState === 'miss') tpFileFetchSum += fileFetchMs
    if (r.tpCacheState === 'miss') tpCacheMissCount++
    else if (r.tpCacheState === 'pending') tpCachePendingCount++
    else if (r.tpCacheState === 'hit') tpCacheHitCount++
    if (r.tpExtractMs !== undefined) tpExtractSum += r.tpExtractMs
    if (r.tpTotalMs !== undefined && r.tpTotalMs !== null) {
      tpPausedSum += r.tpTotalMs
      const e = r.tpExtractMs ?? 0
      const harness = Math.max(0, r.tpTotalMs - fetchMs - e)

      tpHarnessSum += harness
      tpTotalSum += fetchWorkMs + e + harness
      if (r.packId !== undefined && r.tpObservedMs !== undefined) {
        tpServedIntervals.push([r.tpObservedMs, r.tpObservedMs + r.tpTotalMs])
      }
    }
    // For TP fall-throughs, the asset still costs network time — same as
    // baseline. Account for those by adding the BL fetch on those rows.
    if (r.tpFallThrough && r.blFetchMs !== undefined) {
      tpFallThroughBlSum += r.blFetchMs
      tpFallThroughCount++
    }
    if (r.blFetchMs !== undefined) {
      blFetchSum += r.blFetchMs
      blFetchCount++
      if (r.packId !== undefined) {
        blComparableFetchSum += r.blFetchMs
        if (r.blObservedMs !== undefined) {
          blComparableIntervals.push([r.blObservedMs, r.blObservedMs + r.blFetchMs])
        }
      }
    }
    if (r.blBytes !== undefined && r.blBytes !== null) bytesSum += r.blBytes
  }
  const tpEffectiveTotal = tpTotalSum + tpFallThroughBlSum
  const tpServedWindowMs = intervalUnionMs(tpServedIntervals)
  const blComparableWindowMs = intervalUnionMs(blComparableIntervals)

  const tr = sorted
    .map(r => {
      const tpServed = r.packId !== undefined
      const initLabel =
        r.tpCacheState === 'miss'
          ? `init ${fmtMs(r.tpPackInitMs)}`
          : r.tpCacheState === 'pending'
            ? `waited ${fmtMs(r.tpPackInitMs)}`
            : `ready ${fmtMs(r.tpPackInitMs)}`
      const tpFetchCell = tpServed
        ? `${fmtMs(r.tpFetchMs)}<br><span class="dim">${r.tpCacheState ?? 'unknown'} · ${initLabel}${r.tpFileFetchMs ? ` · file-wait ${fmtMs(r.tpFileFetchMs)}` : ''}</span>`
        : '<span class="dim">—</span>'
      const blFetchCell =
        r.blFetchMs !== undefined ? fmtMs(r.blFetchMs) : '<span class="dim">—</span>'
      // Overhead = total − fetch − extract. In CDP mode this is harness IPC;
      // in SW mode it is browser-side response/message overhead.
      const harnessMs =
        tpServed && r.tpTotalMs !== null && r.tpTotalMs !== undefined
          ? Math.max(0, r.tpTotalMs - (r.tpFetchMs ?? 0) - (r.tpExtractMs ?? 0))
          : null
      const tpFetchWorkMs = r.tpCacheState === 'miss' ? (r.tpFetchMs ?? 0) : 0
      // Compare REAL WORK (fetch + extract) vs baseline fetch — i.e. would
      // TokenPack be faster if there were no harness tax.
      const tpRealWork = tpServed ? tpFetchWorkMs + (r.tpExtractMs ?? 0) : null
      let tpClass = ''
      let blClass = ''

      if (tpRealWork !== null && r.blFetchMs !== undefined) {
        if (tpRealWork < r.blFetchMs) tpClass = 'good'
        else if (tpRealWork > r.blFetchMs) blClass = 'good'
      }
      // "Missing" states catch real bugs:
      // - tp-missing: BL fetched a comparable manifest URL, TP never requested it
      //   → page broke in TP before reaching the code that imports this asset.
      // - bl-missing: TP requested it, BL didn't → TP boots a different graph
      //   (e.g., feature flag, error-recovery code path). Worth a flag.
      const tpMissing = !!r.seenInBaseline && !r.seenInTokenpack
      const outsideTpManifest =
        tpMissing && comparableUrls !== undefined && !comparableUrls.has(r.url)
      const blMissing = !r.seenInBaseline && !!r.seenInTokenpack
      const rowCls = outsideTpManifest
        ? 'outside-manifest'
        : tpMissing
          ? 'tp-missing'
          : blMissing
            ? 'bl-missing'
            : r.tpSkippedByThreshold
              ? 'skipped-threshold'
              : r.tpFallThrough && !tpServed
                ? 'fall-through'
                : ''
      const color = tpServed ? packColor(r.packId!) : null
      const packCell = tpServed
        ? `<span class="pack-chip" style="background:${color}"></span><code class="dim">${escape(r.packId!)}</code>`
        : outsideTpManifest
          ? '<span class="badge muted">outside TP manifest</span>'
          : tpMissing
            ? '<span class="badge error">TP did not request</span>'
            : blMissing
              ? '<span class="badge warn">TP-only (not in BL)</span>'
              : r.tpSkippedByThreshold
                ? '<span class="badge skipped">skipped (below threshold)</span>'
                : r.tpFallThrough
                  ? '<span class="badge fall">fall-through</span>'
                  : '<span class="dim">—</span>'
      const packCellStyle = color ? ` style="border-left: 4px solid ${color}"` : ''

      return `
    <tr class="${rowCls}">
      <td class="url"><code>${escape(r.url)}</code></td>
      <td class="pack"${packCellStyle}>${packCell}</td>
      <td class="${tpClass}">${tpFetchCell}</td>
      <td>${tpServed ? fmtMs(r.tpExtractMs) : '<span class="dim">—</span>'}</td>
      <td class="harness">${harnessMs === null ? '<span class="dim">—</span>' : fmtMs(harnessMs)}</td>
      <td>${tpServed ? fmtMs(r.tpTotalMs) : '<span class="dim">—</span>'}</td>
      <td class="${blClass}">${blFetchCell}</td>
      <td>${fmtBytes(r.blBytes)}</td>
    </tr>`
    })
    .join('')

  return `
<table class="grid compact assets">
  <thead>
    <tr>
      <th rowspan="2">Asset URL</th>
      <th rowspan="2">Pack id</th>
      <th colspan="4" class="tp">TokenPack mode</th>
      <th colspan="1" class="bl">Baseline mode</th>
      <th rowspan="2">Asset size</th>
    </tr>
    <tr>
      <th class="tp" title="Full/stream: time this asset waited for pack init. Range-stream: metadata wait + this file's range fetch.">pack/file fetch+decode</th>
      <th class="tp" title="pack.extract(file) — in-memory, sub-ms.">extract</th>
      <th class="harness" title="${overheadTitle}">${overheadLabel}</th>
      <th class="tp" title="Wall-clock time this asset was paused in the TP handler. Per-row pending waits are shown here, but footer totals exclude duplicated pending waits.">paused</th>
      <th class="bl" title="Time to fetch this single asset over the wire in baseline mode.">asset fetch</th>
    </tr>
  </thead>
  <tbody>${tr}</tbody>
  <tfoot>
    <tr class="totals">
      <td colspan="2"><strong>COMPARABLE REQUEST WINDOW</strong><br><span class="dim">overlap-aware wall-clock wait for the same TP-served rows</span></td>
      <td colspan="4" class="tp summary-primary"><strong>${fmtMs(tpServedWindowMs)}</strong><br><span class="dim">TokenPack served request window</span></td>
      <td colspan="2" class="bl summary-primary"><strong>${fmtMs(blComparableWindowMs)}</strong><br><span class="dim">baseline fetch window for those same rows</span></td>
    </tr>
    <tr class="totals">
      <td colspan="2"><strong>TOKENPACK WORK BREAKDOWN</strong><br><span class="dim">diagnostic sum; excludes duplicated pending waits</span></td>
      <td class="tp"><strong>${fmtMs(tpFetchSum)}</strong><br><span class="dim">actual init ${fmtMs(tpPackActualInitSum)} · file work ${fmtMs(tpFileFetchSum)}<br>excluded waits ${fmtMs(tpFetchWaitExcludedSum)} (${fmtMs(tpPackPendingWaitSum)} pending init · ${fmtMs(tpPackHitWaitSum)} ready)<br>${tpCacheMissCount} miss · ${tpCachePendingCount} pending · ${tpCacheHitCount} hit<br>${tpFetchPaidCount} paid fetches</span></td>
      <td class="tp"><strong>${fmtMs(tpExtractSum)}</strong></td>
      <td class="harness"><strong>${fmtMs(tpHarnessSum)}</strong></td>
      <td class="tp"><strong>${fmtMs(tpTotalSum)}</strong><br><span class="dim">deduped diagnostic sum<br>${fmtMs(tpPausedSum)} raw paused sum</span></td>
      <td class="bl"><strong>${fmtMs(blComparableFetchSum)}</strong><br><span class="dim">baseline diagnostic sum for same rows<br>not wall-clock</span></td>
      <td><strong>${fmtBytes(bytesSum)}</strong></td>
    </tr>
    <tr class="totals tp-effective">
      <td colspan="2"><strong>TP EFFECTIVE ASSET SUM</strong><br><span class="dim">deduped TP work + fall-through baseline cost; diagnostic only</span></td>
      <td colspan="4" class="tp" style="text-align:center"><strong>${fmtMs(tpEffectiveTotal)}</strong></td>
      <td colspan="2" class="dim">fall-through rows: ${tpFallThroughCount}</td>
    </tr>
    <tr class="totals">
      <td colspan="2"><strong>ALL BASELINE OBSERVED</strong><br><span class="dim">diagnostic scope check, includes rows outside TP comparison</span></td>
      <td colspan="4" class="dim">—</td>
      <td class="bl"><strong>${fmtMs(blFetchSum)}</strong><br><span class="dim">${blFetchCount} fetches, overlapping</span></td>
      <td><strong>${fmtBytes(bytesSum)}</strong></td>
    </tr>
  </tfoot>
</table>
<h3 style="margin-top:12px">Reading the totals</h3>
<div class="formula">
  <strong>Start with Comparable request window.</strong> This is the closest asset-level wall-clock comparison because it collapses overlapping request waits into a union:
  TP <strong>${fmtMs(tpServedWindowMs)}</strong>, comparable baseline <strong>${fmtMs(blComparableWindowMs)}</strong>.
  <br><br>
  <strong>Do not read diagnostic sums as page duration.</strong> Values like TP <strong>${fmtMs(tpEffectiveTotal)}</strong> or baseline <strong>${fmtMs(blComparableFetchSum)}</strong> are sums across many overlapping rows. They are useful for finding where work accumulated, but they are not directly comparable to the top-level load time.
  <br><br>
  <strong>TP work breakdown</strong> = sum of unique <code>pack/file fetch</code> work + per-asset extract + per-asset overhead across served-from-pack assets =
  <strong>${fmtMs(tpFetchSum)}</strong> + <strong>${fmtMs(tpExtractSum)}</strong> + <strong>${fmtMs(tpHarnessSum)}</strong>
  = <strong>${fmtMs(tpTotalSum)}</strong>
  <br>
  Excluded duplicated waits: <strong>${fmtMs(tpFetchWaitExcludedSum)}</strong>. Raw paused sum before excluding waits:
  <strong>${fmtMs(tpPausedSum)}</strong>.
  <br><br>
  <strong>TP effective asset sum</strong> = TP work breakdown + sum of baseline-fetch ms for assets TP fell through on
  <br>= <strong>${fmtMs(tpTotalSum)}</strong> + <strong>${fmtMs(tpFallThroughBlSum)}</strong> <span class="dim">(${tpFallThroughCount} fall-throughs paid network cost)</span>
  = <strong>${fmtMs(tpEffectiveTotal)}</strong>
  <br><br>
  <strong>Comparable baseline diagnostic sum</strong> = baseline fetch sum for rows TP served =
  <strong>${fmtMs(blComparableFetchSum)}</strong>
  <br>
  <strong>All observed BL asset wait sum</strong> = <strong>${fmtMs(blFetchSum)}</strong>
</div>
<h3 style="margin-top:12px">Reading this table</h3>
<ul class="dim">
  <li><strong>Pack/file fetch+decode</strong> — full/stream variants show the time this request waited for pack initialization. Range-stream variants show metadata wait plus file-region fetch wait. <code>miss</code> is the first initializer for a pack, <code>pending</code> means this asset arrived while another request was already initializing the same pack, and <code>hit</code> means metadata/decode was already available at request start.</li>
  <li><strong>Baseline asset fetch</strong> — time to fetch this single asset over the wire in baseline mode. Adjacent for direct comparison.</li>
  <li><strong>Extract</strong> — <code>pack.extract(file)</code>, in-memory, sub-millisecond.</li>
  <li>${overheadDescription}</li>
  <li><strong>TokenPack total</strong> — fetch + extract + overhead. The wall-clock time spent producing this asset response.</li>
  <li><strong>Green/red coloring</strong> compares <em>real work</em> (fetch + extract) vs baseline fetch — i.e., what TokenPack would cost without the harness tax. Green on the TokenPack side = real work was faster than the baseline fetch.</li>
  <li><strong><span class="badge muted">outside TP manifest</span></strong> — baseline fetched this URL, but it is outside the comparable manifest-handled URL set for this sampled phase. This is not a TokenPack miss.</li>
  <li><strong><span class="badge error">TP did not request</span></strong> — baseline fetched this comparable manifest URL, but the TokenPack run did not request it in the sampled phase. A large cluster usually means the TP page diverged or failed before reaching that import path; an isolated row can also come from feature flags, lazy imports, version drift, or conditional app flow.</li>
  <li><strong><span class="badge warn">TP-only (not in BL)</span></strong> — TokenPack requested this URL but baseline never did. Different code path got executed (feature flag, A/B variant, error-recovery branch).</li>
</ul>
<p class="dim">
  Column sums overstate wall-clock because requests run in parallel. Iteration durations are the real answer.
</p>`
}

function assetName(url: string): string {
  try {
    const parsed = new URL(url)
    const name = parsed.pathname.split('/').filter(Boolean).pop()

    return name || parsed.hostname
  } catch {
    return url.split('/').filter(Boolean).pop() ?? url
  }
}

function packSelector(
  scope: string,
  packs: ReadonlyArray<{ packId: string; count: number }>,
): string {
  if (packs.length === 0) return ''
  const safeScope = safeId(scope)
  const options = packs
    .map(
      (pack, i) =>
        `<option value="${escape(pack.packId)}"${i === 0 ? ' selected' : ''}>${escape(pack.packId)} (${pack.count})</option>`,
    )
    .join('')

  return `
<label class="pack-filter">
  <span>Token</span>
  <select data-pack-select="${safeScope}">
    ${options}
  </select>
</label>`
}

function tokenStats(markers: ReadonlyArray<AssetMarker>, span: number): string {
  let bytesSum = 0
  let firstMissInitMs = 0
  let maxTotalMs = 0
  let maxFetchMs = 0
  let maxFileFetchMs = 0
  let maxExtractMs = 0
  let totalMsValues: number[] = []
  let fileFetchMsValues: number[] = []
  let missCount = 0
  let pendingCount = 0
  let hitCount = 0

  for (const m of markers) {
    const totalMs = m.totalMs ?? 0
    const fetchMs = m.fetchMs ?? 0
    const extractMs = m.extractMs ?? 0
    const fileFetchMs = m.fileFetchMs ?? 0

    bytesSum += m.bytes ?? 0
    maxTotalMs = Math.max(maxTotalMs, totalMs)
    maxFetchMs = Math.max(maxFetchMs, fetchMs)
    maxFileFetchMs = Math.max(maxFileFetchMs, fileFetchMs)
    maxExtractMs = Math.max(maxExtractMs, extractMs)
    totalMsValues.push(totalMs)
    if (fileFetchMs > 0) fileFetchMsValues.push(fileFetchMs)

    if (m.cacheState === 'miss') {
      missCount++
      firstMissInitMs = Math.max(firstMissInitMs, m.packInitMs ?? 0)
    } else if (m.cacheState === 'pending') {
      pendingCount++
    } else if (m.cacheState === 'hit') {
      hitCount++
    }
  }
  const p95 = (values: ReadonlyArray<number>): number => {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)

    return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)] ?? 0
  }

  return `
<div class="token-stats">
  <div><strong>${markers.length}</strong><span>files</span></div>
  <div><strong>${fmtBytes(bytesSum)}</strong><span>decoded bytes</span></div>
  <div><strong>${fmtMs(span)}</strong><span>request window (union)</span></div>
  <div><strong>${fmtMs(firstMissInitMs)}</strong><span>first pack init max</span></div>
  <div><strong>${fmtMs(maxTotalMs)}</strong><span>slowest file wait</span></div>
  <div><strong>${fmtMs(p95(totalMsValues))}</strong><span>p95 file wait</span></div>
  <div><strong>${fmtMs(maxFetchMs)}</strong><span>max fetch wait</span></div>
  <div><strong>${fmtMs(maxFileFetchMs)}</strong><span>max range wait</span></div>
  <div><strong>${fmtMs(p95(fileFetchMsValues))}</strong><span>p95 range wait</span></div>
  <div><strong>${fmtMs(maxExtractMs)}</strong><span>max extract/decompress</span></div>
  <div><strong>${missCount}/${pendingCount}/${hitCount}</strong><span>miss/pending/hit</span></div>
</div>`
}

function tokenWaterfall(
  tokenpackMarkers: ReadonlyArray<AssetMarker> | undefined,
  scope: string,
): string {
  const packs = packOptions(tokenpackMarkers)

  if (packs.length === 0) {
    return '<p class="dim">No TokenPack pack markers available for a waterfall.</p>'
  }

  const safeScope = safeId(scope)
  const packSections = packs
    .map((pack, packIndex) => {
      const markers = (tokenpackMarkers ?? [])
        .filter(m => m.source === 'pack' && m.packId === pack.packId && m.totalMs !== null)
        .sort((a, b) => a.observedMs - b.observedMs)
      const minStart = Math.min(...markers.map(m => m.observedMs))
      const maxEnd = Math.max(...markers.map(m => m.observedMs + (m.totalMs ?? 0)))
      const span = Math.max(1, maxEnd - minStart)
      const bytesSum = markers.reduce((sum, m) => sum + (m.bytes ?? 0), 0)
      const color = packColor(pack.packId)
      const rows = markers
        .map(m => {
          const totalMs = m.totalMs ?? 0
          const left = ((m.observedMs - minStart) / span) * 100
          const width = Math.max(0.8, (totalMs / span) * 100)
          const fetchMs = m.fetchMs ?? 0
          const extractMs = m.extractMs ?? 0
          const overheadMs = Math.max(0, totalMs - fetchMs - extractMs)
          const initLabel =
            m.cacheState === 'pending'
              ? 'manifest wait'
              : m.cacheState === 'hit'
                ? 'ready'
                : 'manifest'
          const fileLabel =
            m.cacheState === 'pending'
              ? 'materialize wait'
              : m.cacheState === 'hit'
                ? m.fileFetchMs !== undefined && m.fileFetchMs > 1
                  ? 'materialize wait'
                  : 'ready'
                : 'fetch+decode'
          const barLabel =
            m.cacheState === 'pending'
              ? `wait ${fmtMs((m.packInitMs ?? 0) + (m.fileFetchMs ?? 0))}`
              : m.cacheState === 'hit' && (m.fileFetchMs ?? 0) <= 1 && totalMs <= 1
                ? 'ready'
              : m.fileFetchMs !== undefined && m.fileFetchMs > 0
                ? `${fileLabel} ${fmtMs(m.fileFetchMs)}`
                : fmtMs(totalMs)
          const isReadyHit = barLabel === 'ready'
          const barColor = m.cacheState === 'pending' ? '#777d86' : color
          const labelLeft = Math.min(78, left + width + 0.6)
          const parts = [
            m.cacheState ? m.cacheState : undefined,
            m.packInitMs !== undefined && !(isReadyHit && m.packInitMs <= 1)
              ? `${initLabel} ${fmtMs(m.packInitMs)}`
              : undefined,
            m.fileFetchMs !== undefined && m.fileFetchMs > 0
              ? `${fileLabel} ${fmtMs(m.fileFetchMs)}`
              : undefined,
            m.extractMs !== undefined && !(isReadyHit && m.extractMs <= 1)
              ? `extract ${fmtMs(m.extractMs)}`
              : undefined,
            overheadMs > 0 ? `response overhead ${fmtMs(overheadMs)}` : undefined,
          ].filter((v): v is string => Boolean(v))

          return `
    <tr>
      <td class="wf-url">
        <code title="${escape(m.url)}">${escape(assetName(m.url))}</code>
        <span class="wf-full-url">${escape(m.url)}</span>
      </td>
      <td class="wf-size">${fmtBytes(m.bytes)}</td>
      <td class="wf-time">${fmtMs(m.observedMs)}</td>
      <td class="wf-lane">
        <div class="wf-bar ${m.cacheState === 'pending' ? 'pending' : ''} ${isReadyHit ? 'ready' : ''}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%;background:${barColor}" title="${escape(m.url)} · ${fmtMs(totalMs)} · ${escape(parts.join(' · '))}"></div>
        ${
          isReadyHit
            ? ''
            : `<span class="wf-bar-note" style="left:${labelLeft.toFixed(2)}%">${escape(barLabel)}</span>`
        }
      </td>
      <td class="wf-total"><strong>${fmtMs(totalMs)}</strong><br><span class="dim">${escape(parts.join(' · '))}</span></td>
    </tr>`
        })
        .join('')

      return `
<section class="pack-scope" data-pack-scope="${safeScope}" data-pack-id="${escape(pack.packId)}"${packIndex === 0 ? '' : ' hidden'}>
  <div class="waterfall-meta">
    <span class="pack-chip" style="background:${color}"></span><code>${escape(pack.packId)}</code>
    <span class="dim">${pack.count} files · ${fmtBytes(bytesSum)} · window ${fmtMs(span)}</span>
  </div>
  ${tokenStats(markers, span)}
  <table class="grid compact waterfall">
    <thead>
      <tr>
        <th>File</th>
        <th>Size</th>
        <th>Start</th>
        <th>Waterfall</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</section>`
    })
    .join('')

  return `
${packSelector(scope, packs)}
${packSections}`
}

function markerPhaseContent(
  scope: string,
  baselineMarkers: ReadonlyArray<AssetMarker> | undefined,
  tokenpackMarkers: ReadonlyArray<AssetMarker> | undefined,
  deliveryMode: 'cdp' | 'sw',
  comparableUrls?: ReadonlySet<string>,
): string {
  return tabbedSection(`${scope}-views`, [
    {
      id: 'markers',
      label: 'Markers',
      content: unifiedAssetTable(baselineMarkers, tokenpackMarkers, deliveryMode, comparableUrls),
    },
    {
      id: 'waterfall',
      label: 'Waterfall',
      note: 'by token',
      content: tokenWaterfall(tokenpackMarkers, `${scope}-waterfall`),
    },
  ])
}

export function buildHtmlReport(report: RunReport, jsonPath: string): string {
  const deliveryMode = report.deliveryMode ?? 'cdp'
  const shape = reportShape(report)
  const display = buildDisplaySummaries(report)
  const baselineIters = report.iterations.filter(r => r.mode === 'baseline')
  const baselineCdpIters = report.iterations.filter(r => r.mode === 'baseline-cdp')
  const tokenpackIters = report.iterations.filter(r => r.mode === 'tokenpack')
  const baselineColdMarkers = bestRecordWithMarkers(baselineIters, 'cold')
  const baselineReloadMarkers = bestRecordWithMarkers(baselineIters, 'reload')
  const baselineCdpColdMarkers = bestRecordWithMarkers(baselineCdpIters, 'cold')
  const baselineCdpReloadMarkers = bestRecordWithMarkers(baselineCdpIters, 'reload')
  const tokenpackColdMarkers = bestRecordWithMarkers(tokenpackIters, 'cold')
  const tokenpackReloadMarkers = bestRecordWithMarkers(tokenpackIters, 'reload')
  const hasReload = report.iterations.some(r => r.reload !== null)
  const markerTabs = (
    scope: string,
    coldTokenpack: RunRecord | undefined,
    reloadTokenpack: RunRecord | undefined,
  ): string => {
    const tabs: TabSpec[] = [
      {
        id: 'cold-markers',
        label: 'Cold markers',
        note: bestMarkerNote(coldTokenpack, 'cold'),
        content: markerPhaseContent(
          `${scope}-cold`,
          baselineColdMarkers?.cold.assetMarkers,
          coldTokenpack?.cold.assetMarkers,
          deliveryMode,
          deliveryMode === 'sw'
            ? undefined
            : markerUrlSet(baselineCdpColdMarkers?.cold.assetMarkers),
        ),
      },
    ]

    if (hasReload) {
      tabs.push({
        id: 'reload-markers',
        label: 'Reload markers',
        note: bestMarkerNote(reloadTokenpack, 'reload'),
        content: markerPhaseContent(
          `${scope}-reload`,
          baselineReloadMarkers?.reload?.assetMarkers,
          reloadTokenpack?.reload?.assetMarkers,
          deliveryMode,
          deliveryMode === 'sw'
            ? undefined
            : markerUrlSet(baselineCdpReloadMarkers?.reload?.assetMarkers),
        ),
      })
    }

    return tabbedSection(scope, tabs)
  }
  const variantBlocks =
    report.tokenpackVariants && display.variantSummaries
      ? tabbedSection(
          'variants',
          report.tokenpackVariants.map(variant => {
            const rows = tokenpackIters.filter(r => r.tokenVariantId === variant.id)
            const coldRatio =
              deliveryMode === 'sw' ? null : computeTpHarnessRatio(rows.map(r => r.cold))
            const reloadRatio =
              deliveryMode === 'sw'
                ? null
                : computeTpHarnessRatio(
                    rows.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
                  )
            const summary = display.variantSummaries?.[variant.id]
            const coldVariantTokenpack = bestRecordWithMarkers(rows, 'cold')
            const reloadVariantTokenpack = bestRecordWithMarkers(rows, 'reload')
            const variantNote = `${variant.loadMode} · ${variant.algo} · c${variant.channels}`

            if (!summary) {
              return {
                id: variant.id,
                label: variant.id,
                note: variantNote,
                content: '<p class="dim">No summary recorded for this variant.</p>',
              }
            }

            return {
              id: variant.id,
              label: variant.id,
              note: variantNote,
              content: `
${variantLabelHtml(variant)}
${variantStrategyHtml(variant)}
${phaseBlock('Cold load', summary.cold, coldRatio, deliveryMode)}
${hasReload ? phaseBlock('Reload', summary.reload, reloadRatio, deliveryMode) : ''}
${sanityComparisonGallery(
  variant.id,
  baselineIters,
  baselineCdpIters,
  rows,
  hasReload,
  deliveryMode,
)}
<h3>Markers</h3>
${markerTabs(`markers-${variant.id}`, coldVariantTokenpack, reloadVariantTokenpack)}`,
            }
          }),
        )
      : (() => {
          const tpColdHarnessRatio =
            deliveryMode === 'sw' ? null : computeTpHarnessRatio(tokenpackIters.map(r => r.cold))
          const tpReloadHarnessRatio =
            deliveryMode === 'sw'
              ? null
              : computeTpHarnessRatio(
                  tokenpackIters.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
                )

          return `
${phaseBlock('Cold load (fresh browser context, no cache)', display.summary.cold, tpColdHarnessRatio, deliveryMode)}
${hasReload ? phaseBlock('Reload (warm browser HTTP cache)', display.summary.reload, tpReloadHarnessRatio, deliveryMode) : ''}
${sanityGallery(report.iterations, hasReload)}
<h3>Markers</h3>
${markerTabs('markers-default', tokenpackColdMarkers, tokenpackReloadMarkers)}`
        })()

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Replay-harness report — ${escape(report.target.id)}</title>
<style>
  :root { color-scheme: dark light; }
  body { font: 14px/1.4 ui-sans-serif, system-ui, sans-serif; max-width: 1600px; margin: 24px auto; padding: 0 16px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 24px 0 8px; border-bottom: 1px solid #8884; padding-bottom: 4px; }
  h3 { font-size: 14px; margin: 16px 0 6px; }
  .report-kicker { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 10px; color: #888; }
  .report-shape { display: inline-flex; align-items: center; border: 1px solid #6a1b9a99; background: #6a1b9a33; color: #d8b8ef; border-radius: 5px; padding: 5px 8px; font-weight: 800; }
  .meta { color: #888; margin-bottom: 16px; line-height: 1.6; }
  .meta code { background: #8881; padding: 1px 4px; border-radius: 3px; }
  .variant-meta { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 14px; }
  .variant-meta span { border: 1px solid #8884; background: #8881; border-radius: 4px; padding: 4px 7px; }
  .variant-strategy { margin: 8px 0 16px; border: 1px solid #8884; border-radius: 6px; background: #8881; }
  .variant-strategy > summary { cursor: pointer; padding: 8px 10px; font-weight: 700; }
  .variant-strategy[open] > summary { border-bottom: 1px solid #8884; }
  .variant-strategy pre { margin: 0; padding: 10px 12px; overflow: auto; }
  .variant-strategy code { font-size: 12px; line-height: 1.45; }
  .grid { width: 100%; border-collapse: collapse; }
  .grid th, .grid td { border: 1px solid #8884; padding: 6px 10px; text-align: left; vertical-align: top; }
  .grid thead th { background: #8881; }
  .grid.compact td, .grid.compact th { padding: 3px 6px; font-size: 12px; }
  .grid.assets td.url, .grid.assets td.pack { word-break: break-all; max-width: 540px; line-height: 1.3; }
  .grid.assets td.url code, .grid.assets td.pack code { font-size: 11px; }
  .grid.assets td { vertical-align: middle; }
  .grid.assets tfoot td { border-top: 2px solid #8888; background: #8881; }
  .grid.assets tfoot .summary-primary strong { font-size: 18px; }
  .grid.iterations .iter-header td { background: #8882; font-size: 12px; padding: 3px 6px; }
  .grid.iterations .iter-cell { background: #8881; vertical-align: middle; text-align: center; }
  .grid.iterations .phase-reload { background: #8881; }
  .dim { color: #888; font-size: 12px; }
  .good { color: #1a7f37; }
  .bad { color: #cf222e; }
  .tp { color: #6a1b9a; }
  .bl { color: #1565c0; }
  code { font: 12px ui-monospace, monospace; }
  ul.dim { padding-left: 20px; }
  ul.dim li { margin-bottom: 4px; }
  .grid.assets thead th[colspan] { text-align: center; border-bottom-width: 2px; }
  tr.tp-effective td { background: rgba(106,27,154,0.08); }
  .formula { font-size: 13px; line-height: 1.7; padding: 12px 16px; background: #8881; border-radius: 4px; margin-top: 8px; }
  .formula code { background: transparent; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; }
  .badge.skipped { background: #fff3cd; color: #856404; border: 1px solid #ffe69c; }
  .badge.fall { background: #ffe0b2; color: #6e3d00; border: 1px solid #ffcc80; }
  .badge.error { background: #f8d7da; color: #842029; border: 1px solid #f5c2c7; }
  .badge.warn { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
  .badge.muted { background: #8882; color: #888; border: 1px solid #8884; }
  tr.skipped-threshold td { background: rgba(255,243,205,0.15); }
  tr.fall-through td { background: rgba(255,224,178,0.10); }
  tr.tp-missing td { background: rgba(220,53,69,0.12); }
  tr.bl-missing td { background: rgba(13,110,253,0.10); }
  tr.outside-manifest td { background: rgba(128,128,128,0.06); }
  .pack-chip { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
  .grid.iterations tbody.iter-group + tbody.iter-group > tr:first-child > td {
    border-top: 6px double #8888;
    padding-top: 8px;
  }
  tr.prod-row td { background: rgba(106,27,154,0.10); border-top: 2px solid #8886; }
  .legend { margin-top: 16px; padding: 12px 16px; background: #8881; border-radius: 4px; font-size: 13px; }
  .legend > strong { display: block; margin-bottom: 6px; }
  .legend ul { margin: 0; padding-left: 20px; }
  .sanity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; }
  .sanity-grid-compare { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .sanity-details { margin: 14px 0; border: 1px solid #8884; border-radius: 6px; background: #8881; }
  .sanity-details > summary { cursor: pointer; padding: 10px 12px; font-weight: 700; }
  .sanity-details[open] > summary { border-bottom: 1px solid #8884; }
  .sanity-iter { padding: 10px 12px 12px; border-top: 1px solid #8882; }
  .sanity-iter:first-of-type { border-top: 0; }
  .sanity-iter h4 { margin: 0 0 8px; }
  .sanity-card { margin: 0; border: 1px solid #8884; border-radius: 6px; overflow: hidden; background: #8881; }
  .sanity-card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: #111; border-bottom: 1px solid #8884; }
  .sanity-card figcaption { padding: 8px 10px; }
  .sanity-text { margin-top: 4px; line-height: 1.35; }
  .tabs { margin-top: 8px; }
  .tab-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 12px; border-bottom: 1px solid #8884; }
  .tab-button { appearance: none; border: 1px solid #8884; border-bottom: 0; border-radius: 6px 6px 0 0; background: #8881; color: inherit; cursor: pointer; padding: 7px 10px; text-align: left; font: inherit; }
  .tab-button:hover { background: #8882; }
  .tab-button.active { background: #6a1b9a22; border-color: #6a1b9a77; color: inherit; }
  .tab-panel[hidden] { display: none; }
  .tab-panels { min-width: 0; }
  .pack-filter { display: flex; align-items: center; gap: 8px; margin: 8px 0 12px; font-size: 12px; color: #888; }
  .pack-filter select { max-width: min(900px, 100%); color: inherit; background: #8881; border: 1px solid #8884; border-radius: 4px; padding: 5px 8px; font: 12px ui-monospace, monospace; }
  .pack-scope[hidden] { display: none; }
  .waterfall-meta { display: flex; align-items: center; gap: 8px; margin: 8px 0; }
  .token-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px; margin: 8px 0 12px; }
  .token-stats > div { border: 1px solid #8884; background: #8881; border-radius: 4px; padding: 7px 9px; }
  .token-stats strong { display: block; font-size: 14px; line-height: 1.2; }
  .token-stats span { display: block; color: #888; font-size: 11px; margin-top: 2px; }
  .grid.waterfall th, .grid.waterfall td { vertical-align: middle; }
  .grid.waterfall .wf-url { width: 360px; max-width: 360px; word-break: break-all; }
  .wf-full-url { display: block; margin-top: 3px; color: #888; font-size: 10px; line-height: 1.25; }
  .grid.waterfall .wf-size { width: 80px; white-space: nowrap; text-align: right; }
  .grid.waterfall .wf-time { width: 80px; white-space: nowrap; }
  .grid.waterfall .wf-total { width: 220px; }
  .wf-lane { position: relative; min-width: 360px; height: 26px; background: linear-gradient(90deg, #8882 1px, transparent 1px) 0 0 / 10% 100%, #8881; border-radius: 3px; overflow: hidden; }
  .wf-bar { position: absolute; top: 4px; height: 18px; min-width: 2px; border-radius: 2px; opacity: 0.92; box-shadow: 0 0 0 1px #0004 inset; overflow: hidden; }
  .wf-bar.pending { opacity: 0.78; background-image: repeating-linear-gradient(135deg, #ffffff18 0 5px, transparent 5px 10px); }
  .wf-bar.ready { width: 4px !important; min-width: 4px; opacity: 0.95; }
  .wf-bar-note { position: absolute; top: 5px; max-width: 170px; padding: 1px 4px; border-radius: 3px; background: #111d; border: 1px solid #8885; color: #ddd; font-size: 10px; font-weight: 700; line-height: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
</style>
</head><body>
<h1>Replay-harness report</h1>
<div class="report-kicker">
  <span class="report-shape">${escape(shape.label)}</span>
  <span>${escape(report.mode)} · ${escape(deliveryMode)} · ${escape(report.throttle || 'NONE')} · ${report.samples} samples</span>
</div>
<div class="meta">
  Target: <code>${escape(report.target.url)}</code><br>
  Fixture: <code>${escape(shape.detail)}</code><br>
  Mode: <code>${report.mode}</code> · Delivery: <code>${deliveryMode}</code> · Strategy: <code>${escape(report.strategy)}</code> · Throttle: <code>${escape(report.throttle || 'NONE')}</code> · Samples: <code>${report.samples}</code><br>
  Captured: <code>${report.capturedAt}</code> · Token-debug: <code>${report.tokenDebug ? 'on' : 'off'}</code> · Reload phase: <code>${hasReload ? 'on' : 'off'}</code><br>
  Raw data: <a href="${escape(jsonPath)}"><code>${escape(jsonPath)}</code></a> · Run log: <a href="run.log"><code>run.log</code></a> · Browser console: <a href="browser-console.log"><code>browser-console.log</code></a>
</div>

<h2>Summary</h2>
${variantBlocks}

<div class="legend">
  <strong>Legend</strong>
  <ul class="dim">
    ${
      report.mode === 'isolate'
        ? '<li><strong>Baseline</strong> — page run with recorded static assets fulfilled from the local isolated asset store. Live document/API requests may still go to origin.</li>'
        : '<li><strong>Baseline</strong> — no interception. Browser fetches assets natively. Closest to real production traffic.</li>'
    }
    ${
      deliveryMode === 'sw'
        ? ''
        : report.mode === 'isolate'
          ? '<li><strong>Baseline-CDP</strong> — same CDP fulfill rig as TP for manifest assets, but bytes come from the recorded local asset store instead of live origin.</li>'
          : '<li><strong>Baseline-CDP</strong> — same harness rig as TP (intercept + fulfill via CDP) but bytes refetched Node-side. Lets us isolate harness IPC tax. Network behaviour differs from baseline (no H/2 multiplexing on Node fetches).</li>'
    }
    ${
      deliveryMode === 'sw'
        ? '<li><strong>TokenPack</strong> — browser Service Worker serves manifest assets from packed PNGs. No Playwright/CDP per-asset fulfill path is included.</li>'
        : '<li><strong>TokenPack</strong> — intercept + serve from packed PNG. Pays harness IPC tax on every served asset.</li>'
    }
    <li><strong>Δ TP vs BL (prod fairness)</strong> — TP minus baseline. Real comparison <em>including</em> harness handicap. If TP wins here, it wins despite the rig.</li>
    ${
      deliveryMode === 'sw'
        ? ''
        : '<li><strong>Δ TP vs BL-CDP (tech fairness)</strong> — TP minus baseline-CDP. Both pay harness tax, so this isolates pack-vs-direct. Tech-level win.</li>'
    }
    ${
      deliveryMode === 'sw'
        ? '<li><strong>SW TP measurement</strong> — direct Service Worker measurement. The report does not apply the old CDP harness-tax projection in this mode.</li>'
        : '<li><strong>Est. prod TP (–harness)</strong> — projection of TP duration with harness IPC tax stripped out. Computed as <code>TP × (1 − harnessRatio)</code> where <code>harnessRatio = sum(harness)/sum(totalMs)</code> across all served-from-pack assets. Approximates a real Service-Worker deployment where the browser delivers pack bytes directly without CDP roundtrips. <em>Estimate, not measurement.</em></li>'
    }
  </ul>
</div>

<h2>Iterations (per-iteration cold + reload)</h2>
${iterationsTable(report.iterations, hasReload, deliveryMode !== 'sw')}

<script>
  document.addEventListener('click', event => {
    const target = event.target
    if (!(target instanceof Element)) return
    const button = target.closest('[data-tab-target]')
    if (!(button instanceof HTMLElement)) return
    const scope = button.getAttribute('data-tab-scope')
    const panelId = button.getAttribute('data-tab-target')
    if (!scope || !panelId) return

    for (const el of document.querySelectorAll('[data-tab-scope]')) {
      if (el.getAttribute('data-tab-scope') === scope) el.classList.toggle('active', el === button)
    }
    for (const panel of document.querySelectorAll('[data-tab-panel-scope]')) {
      if (panel.getAttribute('data-tab-panel-scope') === scope) {
        panel.hidden = panel.getAttribute('data-tab-panel') !== panelId
      }
    }
  })

  document.addEventListener('change', event => {
    const target = event.target
    if (!(target instanceof HTMLSelectElement)) return
    const scope = target.getAttribute('data-pack-select')
    if (!scope) return

    for (const section of document.querySelectorAll('[data-pack-scope]')) {
      if (section.getAttribute('data-pack-scope') === scope) {
        section.hidden = section.getAttribute('data-pack-id') !== target.value
      }
    }
  })
</script>
</body></html>`
}
