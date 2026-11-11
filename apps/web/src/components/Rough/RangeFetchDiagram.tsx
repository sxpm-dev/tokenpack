import { generateRoughPaths } from './rough-paths'

const W = 940
const H = 360

const strokeForRole = (role: string | null): string => {
  if (role === 'accent') return 'var(--accent)'
  if (role === 'muted') return 'var(--soft)'

  return 'var(--fg)'
}

const ROW_H = 96
const FILE_X = 220
const FILE_W = 600

interface Scenario {
  label: string
  sub: string
  costLabel: string
  cost: string
  /** Highlighted byte ranges, as [start, length] in 0-1 normalized. */
  ranges: [number, number][]
  range: 'accent' | 'muted'
}

const SCENARIOS: Scenario[] = [
  {
    label: 'whole file',
    sub: 'GET /data.png',
    cost: '≈ 50 MB',
    costLabel: 'transfer',
    ranges: [[0, 1]],
    range: 'muted',
  },
  {
    label: 'single range',
    sub: 'GET /data.png · Range: bytes=…',
    cost: '≈ 1 KB',
    costLabel: 'transfer',
    ranges: [[0.34, 0.05]],
    range: 'accent',
  },
  {
    label: 'parallel ranges',
    sub: "router.json('events/*') · 4 paths",
    cost: '≈ 8 KB',
    costLabel: 'transfer',
    ranges: [
      [0.08, 0.04],
      [0.28, 0.04],
      [0.52, 0.04],
      [0.76, 0.04],
    ],
    range: 'accent',
  },
]

export function RangeFetchDiagram() {
  const paths = generateRoughPaths(b => {
    SCENARIOS.forEach((scn, rowIdx) => {
      const y = 70 + rowIdx * ROW_H

      // The file bar — the whole token, drawn as a muted rectangle.
      b.rectangle(FILE_X, y + 18, FILE_W, 36, { strokeWidth: 1, role: 'muted' })

      // Highlighted Range slice(s).
      scn.ranges.forEach(([start, len]) => {
        b.rectangle(FILE_X + start * FILE_W, y + 18, len * FILE_W, 36, {
          strokeWidth: 1.4,
          role: scn.range,
        })
      })

      // Tick marks at file boundaries
      b.line(FILE_X, y + 14, FILE_X, y + 62, { strokeWidth: 0.7, role: 'muted' })
      b.line(FILE_X + FILE_W, y + 14, FILE_X + FILE_W, y + 62, {
        strokeWidth: 0.7,
        role: 'muted',
      })
    })
  })

  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Header */}
      <text className="font-mono" fill="var(--fg)" fontSize={13} x={30} y={32}>
        partial fetch is just <tspan fill="var(--accent)">Range</tspan> requests against a static
        file
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={30} y={48}>
        the manifest tells the planner which byte range maps to which logical path
      </text>

      {/* File label header */}
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={FILE_X} y={60}>
        0
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="end"
        x={FILE_X + FILE_W}
        y={60}
      >
        50 MB
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={FILE_X + FILE_W / 2}
        y={60}
      >
        data.png · the whole token
      </text>

      {/* Rows */}
      {SCENARIOS.map((scn, rowIdx) => {
        const y = 70 + rowIdx * ROW_H

        return (
          <g key={scn.label}>
            <text
              className="font-mono"
              fill={scn.range === 'accent' ? 'var(--accent)' : 'var(--fg)'}
              fontSize={12}
              x={30}
              y={y + 24}
            >
              {scn.label}
            </text>
            <text className="font-mono" fill="var(--soft)" fontSize={10} x={30} y={y + 40}>
              {scn.sub}
            </text>
            <text
              className="font-mono"
              fill="var(--soft)"
              fontSize={9}
              textAnchor="end"
              x={W - 30}
              y={y + 24}
            >
              {scn.costLabel}
            </text>
            <text
              className="font-mono"
              fill={scn.range === 'accent' ? 'var(--accent)' : 'var(--fg)'}
              fontSize={12}
              textAnchor="end"
              x={W - 30}
              y={y + 42}
            >
              {scn.cost}
            </text>
          </g>
        )
      })}

      {/* Rough strokes */}
      {paths.map((p, idx) => (
        <path
          key={idx}
          d={p.d}
          fill="none"
          stroke={strokeForRole(p.role)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={p.strokeWidth}
        />
      ))}

      {/* Footer */}
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={W / 2}
        y={H - 14}
      >
        every request is the same static <tspan fill="var(--fg)">/data.png</tspan> · only the Range
        header changes
      </text>
    </svg>
  )
}
