import { formatBytes, formatMs, type RunSummary } from '../benchSummary'
import { SummaryCell } from './SummaryCell'

interface ScenarioSummaryProps {
  summary?: RunSummary
}

export function ScenarioSummary({ summary }: ScenarioSummaryProps) {
  if (!summary) {
    return (
      <span className="mt-3 flex min-h-8 items-center rounded-sm border border-dashed border-tp-border px-2 text-[9px] leading-tight text-tp-soft">
        run to get numbers
      </span>
    )
  }

  const phases = summary.phases
  const assetMs = phases.materializeMs ?? phases.jsCssMs ?? phases.loadMs ?? 0
  const spread =
    summary.runs > 1 ? `${Math.round(summary.minMs)}–${Math.round(summary.maxMs)}` : 'single run'
  // Browser reported (almost) no compressed-body bytes while decoded bytes
  // are real — wire collapsed to per-request header estimates and must not
  // be compared across scenarios. Flagged as "wire✻" per the legend.
  const wireUnreliable =
    summary.bytes !== null &&
    summary.bytes.decodedBytes > 0 &&
    summary.bytes.encodedBytes < summary.bytes.decodedBytes / 100

  return (
    <span className="mt-3 grid overflow-hidden rounded-sm border border-tp-border bg-tp-bg/75">
      <span className="grid grid-cols-3 border-b border-tp-border">
        <SummaryCell label="boot" value={formatMs(summary.totalMs)} />
        <SummaryCell
          label={phases.materializeMs !== undefined ? 'mat' : 'js/css'}
          value={formatMs(assetMs)}
        />
        <SummaryCell label="images" value={formatMs(phases.imagesMs ?? 0)} />
      </span>
      <span className="grid grid-cols-2 border-b border-tp-border">
        <SummaryCell
          label={wireUnreliable ? 'wire✻' : 'wire'}
          value={summary.bytes ? formatBytes(summary.bytes.transferBytes) : '—'}
        />
        <SummaryCell
          label="body"
          value={summary.bytes ? formatBytes(summary.bytes.decodedBytes) : '—'}
        />
      </span>
      <span className="grid grid-cols-2">
        <SummaryCell label="reqs" value={summary.bytes ? String(summary.bytes.requests) : '—'} />
        <SummaryCell label={`n=${summary.runs}`} value={spread} />
      </span>
    </span>
  )
}
