import { generateRoughPaths } from './rough-paths'

const W = 940
const H = 380

const strokeForRole = (role: string | null): string => {
  if (role === 'accent') return 'var(--accent)'
  if (role === 'muted') return 'var(--soft)'
  if (role === 'danger') return 'var(--danger, #d94c4c)'

  return 'var(--fg)'
}

const BUCKET_X = 410
const BUCKET_Y = 110
const BUCKET_W = 160
const BUCKET_H = 160

const ORCH_X = 60
const ORCH_Y = 170
const ORCH_W = 120
const ORCH_H = 50

interface Worker {
  y: number
  label: string
}

const WORKERS: Worker[] = [
  { y: 60, label: 'agent-a' },
  { y: 160, label: 'agent-b' },
  { y: 260, label: 'agent-c' },
]

const WORKER_X = 720
const WORKER_W = 160
const WORKER_H = 50

export function OrchestrationLegacyDiagram() {
  const paths = generateRoughPaths(b => {
    // Orchestrator box
    b.rectangle(ORCH_X, ORCH_Y, ORCH_W, ORCH_H, { strokeWidth: 1.2 })

    // Shared bucket (the bottleneck) — danger stroke
    b.rectangle(BUCKET_X, BUCKET_Y, BUCKET_W, BUCKET_H, { strokeWidth: 1.6, role: 'danger' })

    // Workers
    for (const w of WORKERS) {
      b.rectangle(WORKER_X, w.y, WORKER_W, WORKER_H, { strokeWidth: 1.2 })
    }

    // Orchestrator → bucket (upload artifacts)
    b.arrow(ORCH_X + ORCH_W + 6, ORCH_Y + ORCH_H / 2, BUCKET_X - 6, BUCKET_Y + 40, {
      strokeWidth: 1.1,
      roughness: 1.3,
    })

    // Bucket → each worker (signed URL, IAM-gated)
    for (const w of WORKERS) {
      b.arrow(BUCKET_X + BUCKET_W + 6, BUCKET_Y + BUCKET_H / 2, WORKER_X - 6, w.y + WORKER_H / 2, {
        strokeWidth: 1,
        roughness: 1.4,
      })
    }

    // Worker → bucket (write back) — second pass
    for (const w of WORKERS) {
      b.arrow(WORKER_X - 6, w.y + WORKER_H + 4, BUCKET_X + BUCKET_W + 6, BUCKET_Y + BUCKET_H - 20, {
        strokeWidth: 0.9,
        roughness: 1.6,
        role: 'muted',
      })
    }

    // Painful IAM badges scattered around the bucket
    b.ellipse(BUCKET_X + 30, BUCKET_Y - 8, 64, 22, { strokeWidth: 1, role: 'danger' })
    b.ellipse(BUCKET_X + BUCKET_W - 30, BUCKET_Y + BUCKET_H + 8, 80, 22, {
      strokeWidth: 1,
      role: 'danger',
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
        today: shared bucket + IAM + ad-hoc layout
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={30} y={48}>
        every worker needs auth · the bucket layout becomes an undocumented contract
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

      {/* Orchestrator label */}
      <text
        className="font-mono"
        fill="var(--fg)"
        fontSize={12}
        textAnchor="middle"
        x={ORCH_X + ORCH_W / 2}
        y={ORCH_Y + 22}
      >
        orchestrator
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={ORCH_X + ORCH_W / 2}
        y={ORCH_Y + 38}
      >
        coordinator
      </text>

      {/* Bucket label */}
      <text
        className="font-mono"
        fill="var(--danger, #d94c4c)"
        fontSize={12}
        textAnchor="middle"
        x={BUCKET_X + BUCKET_W / 2}
        y={BUCKET_Y + BUCKET_H / 2 - 4}
      >
        S3 bucket
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={BUCKET_X + BUCKET_W / 2}
        y={BUCKET_Y + BUCKET_H / 2 + 14}
      >
        slice-a/data.json
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={BUCKET_X + BUCKET_W / 2}
        y={BUCKET_Y + BUCKET_H / 2 + 30}
      >
        slice-b/data.json
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={BUCKET_X + BUCKET_W / 2}
        y={BUCKET_Y + BUCKET_H / 2 + 46}
      >
        slice-c/data.json
      </text>

      {/* IAM badges */}
      <text
        className="font-mono"
        fill="var(--danger, #d94c4c)"
        fontSize={10}
        textAnchor="middle"
        x={BUCKET_X + 30}
        y={BUCKET_Y - 4}
      >
        IAM gate
      </text>
      <text
        className="font-mono"
        fill="var(--danger, #d94c4c)"
        fontSize={10}
        textAnchor="middle"
        x={BUCKET_X + BUCKET_W - 30}
        y={BUCKET_Y + BUCKET_H + 13}
      >
        bucket layout = contract
      </text>

      {/* Worker labels */}
      {WORKERS.map(w => (
        <g key={w.label}>
          <text className="font-mono" fill="var(--fg)" fontSize={12} x={WORKER_X + 12} y={w.y + 22}>
            {w.label}
          </text>
          <text
            className="font-mono"
            fill="var(--soft)"
            fontSize={10}
            x={WORKER_X + 12}
            y={w.y + 38}
          >
            needs auth · downloads whole zip
          </text>
        </g>
      ))}

      {/* Footer */}
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={W / 2}
        y={H - 12}
      >
        every worker round-trips the bucket · partial reads need a fresh signed URL each time
      </text>
    </svg>
  )
}
