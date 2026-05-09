import type { RunReport, RunRecord, AssetMarker, PhaseSummary, PhaseRecord } from './types.js'
import { fmtBytes, fmtMs, fmtPct, fmtSign } from '../format.js'

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

function phaseBlock(label: string, p: PhaseSummary, tpHarnessRatio: number | null): string {
  const cell = (s: { avgMs: number; minMs: number; maxMs: number }): string =>
    `avg ${fmtMs(s.avgMs)}<br><span class="dim">(${fmtMs(s.minMs)}–${fmtMs(s.maxMs)})</span>`
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
  const prodRow =
    tpHarnessRatio === null || tpAvg === 0
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
  return `
<h3>${label}</h3>
<table class="grid">
  <thead>
    <tr>
      <th>Metric</th>
      <th class="bl">Baseline<br><span class="dim">(no intercept)</span></th>
      <th class="bl">Baseline-CDP<br><span class="dim">(intercept + refetch)</span></th>
      <th class="tp">TokenPack<br><span class="dim">(intercept + pack)</span></th>
      <th>Δ TP vs BL<br><span class="dim">(prod fairness)</span></th>
      <th>Δ TP vs BL-CDP<br><span class="dim">(tech fairness)</span></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Total duration</td>
      <td>${cell(p.baseline.duration)}</td>
      <td>${cell(p.baselineCdp.duration)}</td>
      <td>${cell(p.tokenpack.duration)}</td>
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

function iterationsTable(rows: ReadonlyArray<RunRecord>, hasReload: boolean): string {
  const order = { baseline: 0, 'baseline-cdp': 1, tokenpack: 2 } as const
  const byIter = new Map<number, RunRecord[]>()
  for (const r of rows) {
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
    return `<td>${fmtMs(p.durationMs)}${ratioCell(p.durationMs, base)}</td><td>${fmtMs(p.loadEventMs)}</td><td>${p.served ?? '—'}</td><td>${p.fellThrough ?? '—'}</td>`
  }

  const tbodies = [...byIter.entries()]
    .sort(([a], [b]) => a - b)
    .map(([iter, group]) => {
      const baseline = group.find(r => r.mode === 'baseline')
      const baseCold = baseline?.cold.durationMs
      const baseReload = baseline?.reload?.durationMs ?? undefined
      const trs = group
        .map(r => {
          const cls =
            r.mode === 'tokenpack' ? 'tp' : r.mode === 'baseline-cdp' ? 'bl-cdp' : 'bl'
          return `
    <tr>
      <td>${r.iter}</td>
      <td class="${cls}">${r.mode}</td>
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

interface PerUrlRow {
  url: string
  packId?: string
  tpFetchMs?: number
  tpExtractMs?: number
  tpTotalMs?: number | null
  tpStatus?: number | null
  /** TokenPack treated this URL as a fall-through. */
  tpFallThrough?: boolean
  /** Distinguished fall-through caused by min-group-size threshold. */
  tpSkippedByThreshold?: boolean
  blFetchMs?: number
  blStatus?: number | null
  blBytes?: number | null
  /** True if any baseline marker mentioned this URL. */
  seenInBaseline?: boolean
  /** True if any tokenpack marker mentioned this URL (any source). */
  seenInTokenpack?: boolean
}

function unifiedAssetTable(
  baselineMarkers: ReadonlyArray<AssetMarker> | undefined,
  tokenpackMarkers: ReadonlyArray<AssetMarker> | undefined,
): string {
  const rows = new Map<string, PerUrlRow>()
  if (tokenpackMarkers) {
    for (const m of tokenpackMarkers) {
      const row = rows.get(m.url) ?? { url: m.url }
      row.seenInTokenpack = true
      if (m.source === 'pack') {
        row.packId = m.packId
        row.tpFetchMs = m.fetchMs
        row.tpExtractMs = m.extractMs
        row.tpTotalMs = m.totalMs
        row.tpStatus = m.status
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
      row.blStatus = m.status
      row.blBytes = m.bytes
      rows.set(m.url, row)
    }
  }
  if (rows.size === 0)
    return '<p class="dim">No asset markers (run with --token-debug).</p>'

  const sorted = [...rows.values()].sort((a, b) => {
    const ap = a.packId ? 0 : 1
    const bp = b.packId ? 0 : 1
    if (ap !== bp) return ap - bp
    if (a.packId && b.packId && a.packId !== b.packId) return a.packId.localeCompare(b.packId)
    return a.url.localeCompare(b.url)
  })

  let tpFetchSum = 0
  let tpExtractSum = 0
  let tpHarnessSum = 0
  let tpTotalSum = 0
  let tpFallThroughBlSum = 0      // sum of BL fetch ms for rows TP fell through on
  let blFetchSum = 0
  let bytesSum = 0
  let tpFetchPaidCount = 0
  let tpFallThroughCount = 0
  let blFetchCount = 0
  for (const r of sorted) {
    if (r.tpFetchMs !== undefined) {
      tpFetchSum += r.tpFetchMs
      if (r.tpFetchMs > 0) tpFetchPaidCount++
    }
    if (r.tpExtractMs !== undefined) tpExtractSum += r.tpExtractMs
    if (r.tpTotalMs !== undefined && r.tpTotalMs !== null) {
      tpTotalSum += r.tpTotalMs
      const f = r.tpFetchMs ?? 0
      const e = r.tpExtractMs ?? 0
      const harness = Math.max(0, r.tpTotalMs - f - e)
      tpHarnessSum += harness
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
    }
    if (r.blBytes !== undefined && r.blBytes !== null) bytesSum += r.blBytes
  }
  const tpEffectiveTotal = tpTotalSum + tpFallThroughBlSum

  const tr = sorted
    .map(r => {
      const tpServed = r.packId !== undefined
      const tpFetchCell = tpServed
        ? `${fmtMs(r.tpFetchMs)}${r.tpFetchMs === 0 ? '<br><span class="dim">cached</span>' : ''}`
        : '<span class="dim">—</span>'
      const blFetchCell =
        r.blFetchMs !== undefined ? fmtMs(r.blFetchMs) : '<span class="dim">—</span>'
      // Harness = total − fetch − extract. The CDP/IPC/serialize cost that
      // wouldn't exist in a Service-Worker production deployment.
      const harnessMs =
        tpServed && r.tpTotalMs !== null && r.tpTotalMs !== undefined
          ? Math.max(0, r.tpTotalMs - (r.tpFetchMs ?? 0) - (r.tpExtractMs ?? 0))
          : null
      // Compare REAL WORK (fetch + extract) vs baseline fetch — i.e. would
      // TokenPack be faster if there were no harness tax.
      const tpRealWork =
        tpServed ? (r.tpFetchMs ?? 0) + (r.tpExtractMs ?? 0) : null
      let tpClass = ''
      let blClass = ''
      if (tpRealWork !== null && r.blFetchMs !== undefined) {
        if (tpRealWork < r.blFetchMs) tpClass = 'good'
        else if (tpRealWork > r.blFetchMs) blClass = 'good'
      }
      // "Missing" states catch real bugs:
      // - tp-missing: BL fetched it, TP never even requested it → page broke
      //   in TP before reaching the code that imports this asset.
      // - bl-missing: TP requested it, BL didn't → TP boots a different graph
      //   (e.g., feature flag, error-recovery code path). Worth a flag.
      const tpMissing = !!r.seenInBaseline && !r.seenInTokenpack
      const blMissing = !r.seenInBaseline && !!r.seenInTokenpack
      const rowCls = tpMissing
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
        : tpMissing
          ? '<span class="badge error">TP did not load</span>'
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
      <th class="tp" title="Pack fetch + stream-decode time charged to this asset. 0 = pack already cached by an earlier sibling.">pack fetch+decode</th>
      <th class="tp" title="pack.extract(file) — in-memory, sub-ms.">extract</th>
      <th class="harness" title="Total − (fetch + extract). Playwright/CDP/base64/page.evaluate overhead. Zero in a real Service-Worker deployment.">harness IPC tax</th>
      <th class="tp" title="Wall-clock time the asset was paused in the TP handler. Equals fetch + extract + harness tax.">total</th>
      <th class="bl" title="Time to fetch this single asset over the wire in baseline mode.">asset fetch</th>
    </tr>
  </thead>
  <tbody>${tr}</tbody>
  <tfoot>
    <tr class="totals">
      <td colspan="2"><strong>TOTAL</strong><br><span class="dim">column sums</span></td>
      <td class="tp"><strong>${fmtMs(tpFetchSum)}</strong><br><span class="dim">${tpFetchPaidCount} pack fetches paid<br>· rest cached</span></td>
      <td class="tp"><strong>${fmtMs(tpExtractSum)}</strong></td>
      <td class="harness"><strong>${fmtMs(tpHarnessSum)}</strong></td>
      <td class="tp"><strong>${fmtMs(tpTotalSum)}</strong></td>
      <td class="bl"><strong>${fmtMs(blFetchSum)}</strong><br><span class="dim">${blFetchCount} asset fetches</span></td>
      <td><strong>${fmtBytes(bytesSum)}</strong></td>
    </tr>
    <tr class="totals tp-effective">
      <td colspan="2"><strong>TP EFFECTIVE TOTAL</strong><br><span class="dim">incl. fall-through cost</span></td>
      <td colspan="4" class="tp" style="text-align:center"><strong>${fmtMs(tpEffectiveTotal)}</strong></td>
      <td colspan="2" class="dim">vs Baseline ${fmtMs(blFetchSum)}</td>
    </tr>
  </tfoot>
</table>
<h3 style="margin-top:12px">Reading the totals</h3>
<div class="formula">
  <strong>TP TOTAL</strong> = sum of <code>fetch + extract + harness</code> across served-from-pack assets =
  <strong>${fmtMs(tpFetchSum)}</strong> + <strong>${fmtMs(tpExtractSum)}</strong> + <strong>${fmtMs(tpHarnessSum)}</strong>
  = <strong>${fmtMs(tpTotalSum)}</strong>
  <br><br>
  <strong>TP EFFECTIVE TOTAL</strong> = TP TOTAL + sum of baseline-fetch ms for assets TP fell through on
  <br>= <strong>${fmtMs(tpTotalSum)}</strong> + <strong>${fmtMs(tpFallThroughBlSum)}</strong> <span class="dim">(${tpFallThroughCount} fall-throughs paid network cost)</span>
  = <strong>${fmtMs(tpEffectiveTotal)}</strong>
  <br><br>
  <strong>BL TOTAL</strong> = sum of all asset-fetch ms in baseline =
  <strong>${fmtMs(blFetchSum)}</strong>
  <br><br>
  These are <em>column sums</em> — overstate wall-clock because requests run in parallel. Use iteration durations as the real wall-clock answer; use these to understand <em>where time is spent</em>.
</div>
<h3 style="margin-top:12px">Reading this table</h3>
<ul class="dim">
  <li><strong>Pack fetch+decode</strong> — pack download + stream-decode time, charged to this asset only on the FIRST hit per pack (subsequent hits show <code>0 ms · cached</code>).</li>
  <li><strong>Baseline asset fetch</strong> — time to fetch this single asset over the wire in baseline mode. Adjacent for direct comparison.</li>
  <li><strong>Extract</strong> — <code>pack.extract(file)</code>, in-memory, sub-millisecond.</li>
  <li><strong>Harness IPC tax</strong> — <code>total − fetch − extract</code>. Pure overhead from this measurement rig: Playwright <code>page.evaluate</code> CDP roundtrip, base64 encode in browser, base64 decode in Node, base64 re-encode for <code>Fetch.fulfillRequest</code>, and queueing when many requests fire concurrently. <strong>Zero in a real Service-Worker deployment.</strong></li>
  <li><strong>TokenPack total</strong> — fetch + extract + harness tax. The wall-clock time the asset was paused in our handler.</li>
  <li><strong>Green/red coloring</strong> compares <em>real work</em> (fetch + extract) vs baseline fetch — i.e., what TokenPack would cost without the harness tax. Green on the TokenPack side = real work was faster than the baseline fetch.</li>
  <li><strong><span class="badge error">TP did not load</span></strong> — baseline fetched this URL, but TokenPack never even requested it. Means the page broke during TP boot before reaching the code that imports this asset (likely a pack-decode failure or wrong response headers earlier in the load).</li>
  <li><strong><span class="badge warn">TP-only (not in BL)</span></strong> — TokenPack requested this URL but baseline never did. Different code path got executed (feature flag, A/B variant, error-recovery branch).</li>
</ul>
<p class="dim">
  Column sums overstate wall-clock because requests run in parallel. Iteration durations are the real answer.
</p>`
}

export function buildHtmlReport(report: RunReport, jsonPath: string): string {
  const baselineIters = report.iterations.filter(r => r.mode === 'baseline')
  const tokenpackIters = report.iterations.filter(r => r.mode === 'tokenpack')
  const lastBaseline = baselineIters[baselineIters.length - 1]
  const lastTokenpack = tokenpackIters[tokenpackIters.length - 1]
  const hasReload = report.iterations.some(r => r.reload !== null)
  const tpColdHarnessRatio = computeTpHarnessRatio(tokenpackIters.map(r => r.cold))
  const tpReloadHarnessRatio = computeTpHarnessRatio(
    tokenpackIters.map(r => r.reload).filter((p): p is PhaseRecord => p !== null),
  )

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
  .meta { color: #888; margin-bottom: 16px; line-height: 1.6; }
  .meta code { background: #8881; padding: 1px 4px; border-radius: 3px; }
  .grid { width: 100%; border-collapse: collapse; }
  .grid th, .grid td { border: 1px solid #8884; padding: 6px 10px; text-align: left; vertical-align: top; }
  .grid thead th { background: #8881; }
  .grid.compact td, .grid.compact th { padding: 3px 6px; font-size: 12px; }
  .grid.assets td.url, .grid.assets td.pack { word-break: break-all; max-width: 540px; line-height: 1.3; }
  .grid.assets td.url code, .grid.assets td.pack code { font-size: 11px; }
  .grid.assets td { vertical-align: middle; }
  .grid.assets tfoot td { border-top: 2px solid #8888; background: #8881; }
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
  tr.skipped-threshold td { background: rgba(255,243,205,0.15); }
  tr.fall-through td { background: rgba(255,224,178,0.10); }
  tr.tp-missing td { background: rgba(220,53,69,0.12); }
  tr.bl-missing td { background: rgba(13,110,253,0.10); }
  .pack-chip { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
  .grid.iterations tbody.iter-group + tbody.iter-group > tr:first-child > td {
    border-top: 6px double #8888;
    padding-top: 8px;
  }
  tr.prod-row td { background: rgba(106,27,154,0.10); border-top: 2px solid #8886; }
  .legend { margin-top: 16px; padding: 12px 16px; background: #8881; border-radius: 4px; font-size: 13px; }
  .legend > strong { display: block; margin-bottom: 6px; }
  .legend ul { margin: 0; padding-left: 20px; }
</style>
</head><body>
<h1>Replay-harness report</h1>
<div class="meta">
  Target: <code>${escape(report.target.url)}</code><br>
  Mode: <code>${report.mode}</code> · Strategy: <code>${escape(report.strategy)}</code> · Throttle: <code>${escape(report.throttle || 'NONE')}</code> · Samples: <code>${report.samples}</code><br>
  Captured: <code>${report.capturedAt}</code> · Token-debug: <code>${report.tokenDebug ? 'on' : 'off'}</code> · Reload phase: <code>${hasReload ? 'on' : 'off'}</code><br>
  Raw data: <a href="${escape(jsonPath)}"><code>${escape(jsonPath)}</code></a>
</div>

<h2>Summary</h2>
${phaseBlock('Cold load (fresh browser context, no cache)', report.summary.cold, tpColdHarnessRatio)}
${hasReload ? phaseBlock('Reload (warm browser HTTP cache)', report.summary.reload, tpReloadHarnessRatio) : ''}

<div class="legend">
  <strong>Legend</strong>
  <ul class="dim">
    <li><strong>Baseline</strong> — no interception. Browser fetches assets natively. Closest to real production traffic.</li>
    <li><strong>Baseline-CDP</strong> — same harness rig as TP (intercept + fulfill via CDP) but bytes refetched Node-side. Lets us isolate harness IPC tax. Network behaviour differs from baseline (no H/2 multiplexing on Node fetches).</li>
    <li><strong>TokenPack</strong> — intercept + serve from packed PNG. Pays harness IPC tax on every served asset.</li>
    <li><strong>Δ TP vs BL (prod fairness)</strong> — TP minus baseline. Real comparison <em>including</em> harness handicap. If TP wins here, it wins despite the rig.</li>
    <li><strong>Δ TP vs BL-CDP (tech fairness)</strong> — TP minus baseline-CDP. Both pay harness tax, so this isolates pack-vs-direct. Tech-level win.</li>
    <li><strong>Est. prod TP (–harness)</strong> — projection of TP duration with harness IPC tax stripped out. Computed as <code>TP × (1 − harnessRatio)</code> where <code>harnessRatio = sum(harness)/sum(totalMs)</code> across all served-from-pack assets. Approximates a real Service-Worker deployment where the browser delivers pack bytes directly without CDP roundtrips. <em>Estimate, not measurement.</em></li>
  </ul>
</div>

<h2>Iterations (per-iteration cold + reload)</h2>
${iterationsTable(report.iterations, hasReload)}

<h2>Per-asset comparison (last iteration, cold phase)</h2>
${unifiedAssetTable(lastBaseline?.cold.assetMarkers, lastTokenpack?.cold.assetMarkers)}

</body></html>`
}
