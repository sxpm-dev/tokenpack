import { generateRoughPaths } from './rough-paths'

const W = 940
const H = 320

const strokeForRole = (role: string | null): string => {
  if (role === 'accent') return 'var(--accent)'
  if (role === 'muted') return 'var(--soft)'

  return 'var(--fg)'
}

// Two timeline rows
const ROW1_Y = 100 // serial
const ROW2_Y = 220 // parallel

const TIMELINE_X = 220
const TIMELINE_W = 600
const BAR_H = 28

const TICKS = ['0', '250 ms', '500 ms', '750 ms', '1 s']

export function ParallelStreamDiagram() {
  // Serial row: one long bar (4× T)
  // Parallel row: 4 short bars stacked horizontally (each 1× T)

  const paths = generateRoughPaths(b => {
    // Timeline base lines (rough horizontal axes)
    b.line(TIMELINE_X, ROW1_Y + 50, TIMELINE_X + TIMELINE_W, ROW1_Y + 50, {
      strokeWidth: 0.8,
      role: 'muted',
    })
    b.line(TIMELINE_X, ROW2_Y + 50, TIMELINE_X + TIMELINE_W, ROW2_Y + 50, {
      strokeWidth: 0.8,
      role: 'muted',
    })

    // Serial bar — one chunk of the whole timeline
    b.rectangle(TIMELINE_X, ROW1_Y, TIMELINE_W * 0.96, BAR_H, {
      strokeWidth: 1.2,
      role: 'muted',
    })

    // Parallel — 4 small bars at the start, each 1/4 length, stacked vertically inside the bar height
    const segLen = TIMELINE_W * 0.24

    for (let i = 0; i < 4; i += 1) {
      b.rectangle(TIMELINE_X, ROW2_Y + i * 7, segLen, BAR_H - 14, {
        strokeWidth: 1.2,
        role: 'accent',
      })
    }

    // Vertical tick marks under both rows
    for (let i = 0; i < TICKS.length; i += 1) {
      const x = TIMELINE_X + (TIMELINE_W * i) / (TICKS.length - 1)

      b.line(x, ROW1_Y + 50, x, ROW1_Y + 56, { strokeWidth: 0.7, role: 'muted' })
      b.line(x, ROW2_Y + 50, x, ROW2_Y + 56, { strokeWidth: 0.7, role: 'muted' })
    }
  })

  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Header */}
      <text className="font-mono" fill="var(--fg)" fontSize={13} x={30} y={40}>
        4 MB asset · split across 4 chunks
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={30} y={56}>
        the planner issues N parallel range requests; the decoder reassembles by fileOffset
      </text>

      {/* Row labels */}
      <text className="font-mono" fill="var(--fg)" fontSize={11} x={30} y={ROW1_Y + 20}>
        serial fetch
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={30} y={ROW1_Y + 36}>
        whole file
      </text>
      <text className="font-mono" fill="var(--muted)" fontSize={10} x={30} y={ROW1_Y + 70}>
        ≈ 4 × RTT + 4 × transfer
      </text>

      <text className="font-mono" fill="var(--accent)" fontSize={11} x={30} y={ROW2_Y + 20}>
        parallel range fetch
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={30} y={ROW2_Y + 36}>
        4 chunks at once
      </text>
      <text className="font-mono" fill="var(--muted)" fontSize={10} x={30} y={ROW2_Y + 70}>
        ≈ 1 × RTT + 1 × transfer
      </text>

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

      {/* Time ticks */}
      {TICKS.map((t, i) => {
        const x = TIMELINE_X + (TIMELINE_W * i) / (TICKS.length - 1)

        return (
          <g key={t}>
            <text
              className="font-mono"
              fill="var(--soft)"
              fontSize={9}
              textAnchor="middle"
              x={x}
              y={ROW1_Y + 70}
            >
              {t}
            </text>
            <text
              className="font-mono"
              fill="var(--soft)"
              fontSize={9}
              textAnchor="middle"
              x={x}
              y={ROW2_Y + 70}
            >
              {t}
            </text>
          </g>
        )
      })}

      {/* "all happens inside the runtime planner — your code doesn't change" caption */}
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={W / 2}
        y={H - 14}
      >
        all of this is under <tspan fill="var(--fg)">router.text(path)</tspan>. your code calls one
        function; the runtime fans the work out.
      </text>
    </svg>
  )
}
