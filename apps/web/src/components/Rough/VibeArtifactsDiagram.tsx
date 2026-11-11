import { generateRoughPaths } from './rough-paths'

const W = 920
const H = 320

const strokeForRole = (role: string | null): string => {
  if (role === 'accent') return 'var(--accent)'
  if (role === 'muted') return 'var(--soft)'

  return 'var(--fg)'
}

// Stage X positions
const STAGE_W = 160
const STAGES_X = [40, 240, 440, 640]
const STAGE_Y = 110
const STAGE_H = 100

const STAGES = [
  { label: 'AI agent', sub: 'generates app', accent: false },
  { label: 'app.png', sub: 'router token', accent: true },
  { label: 'paste · share', sub: 'chat · CDN · email', accent: false },
  { label: 'materialize()', sub: 'live in your DOM', accent: true },
]

export function VibeArtifactsDiagram() {
  const paths = generateRoughPaths(b => {
    // Stage boxes
    STAGES.forEach((stage, i) => {
      const x = STAGES_X[i]!

      b.rectangle(x, STAGE_Y, STAGE_W, STAGE_H, {
        strokeWidth: stage.accent ? 1.4 : 1,
        role: stage.accent ? 'accent' : undefined,
      })
    })

    // Arrows between stages
    for (let i = 0; i < STAGES_X.length - 1; i += 1) {
      const start = STAGES_X[i]! + STAGE_W + 6
      const end = STAGES_X[i + 1]! - 6

      b.arrow(start, STAGE_Y + STAGE_H / 2, end, STAGE_Y + STAGE_H / 2, {
        strokeWidth: 1.1,
        roughness: 1.3,
      })
    }

    // Tiny "live" preview to the right of the last stage
    b.rectangle(820, STAGE_Y + 10, 80, 80)
    b.line(826, STAGE_Y + 30, 894, STAGE_Y + 30, { strokeWidth: 0.7, role: 'muted' })
    b.rectangle(832, STAGE_Y + 42, 56, 14, { strokeWidth: 1, role: 'accent' })
    b.line(832, STAGE_Y + 65, 880, STAGE_Y + 65, { strokeWidth: 0.6, role: 'muted' })
    b.line(832, STAGE_Y + 75, 870, STAGE_Y + 75, { strokeWidth: 0.6, role: 'muted' })

    // Final arrow into preview
    b.arrow(STAGES_X[3]! + STAGE_W + 6, STAGE_Y + STAGE_H / 2, 820 - 6, STAGE_Y + STAGE_H / 2, {
      strokeWidth: 1,
      roughness: 1.4,
    })
  })

  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Header strip */}
      <text className="font-mono" fill="var(--soft)" fontSize={11} x={STAGES_X[0]} y={56}>
        Prototype to production-paste in four moves.
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={STAGES_X[0]} y={74}>
        no deploy step · no build server · no account
      </text>

      {/* Rough outlines */}
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

      {/* Stage labels */}
      {STAGES.map((stage, i) => {
        const x = STAGES_X[i]! + STAGE_W / 2

        return (
          <g key={i}>
            <text
              className="font-mono"
              fill={stage.accent ? 'var(--accent)' : 'var(--fg)'}
              fontSize={13}
              textAnchor="middle"
              x={x}
              y={STAGE_Y + 38}
            >
              {stage.label}
            </text>
            <text
              className="font-mono"
              fill="var(--soft)"
              fontSize={10}
              textAnchor="middle"
              x={x}
              y={STAGE_Y + 58}
            >
              {stage.sub}
            </text>
          </g>
        )
      })}

      {/* "live" preview label */}
      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={9}
        textAnchor="middle"
        x={860}
        y={STAGE_Y + 52}
      >
        live
      </text>

      {/* Bottom caption */}
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={W / 2}
        y={H - 24}
      >
        one Image Token. anyone with the URL can run it.
      </text>
    </svg>
  )
}
