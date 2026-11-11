import { generateRoughPaths } from './rough-paths'

const W = 920
const H = 380

// Grayscale pixels for the input / output tokens (real-looking PNGs)
function mulberry32(seed: number): () => number {
  let s = seed >>> 0

  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s

    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hashSeed(s: string): number {
  let h = 0

  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }

  return h
}
function buildGrayPixels(w: number, h: number, seed: string) {
  const rng = mulberry32(hashSeed(seed))
  const out: { x: number; y: number; color: string }[] = []

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const lit = 26 + Math.floor(rng() * 40)

      out.push({ x, y, color: `hsl(0 0% ${lit}%)` })
    }
  }

  return out
}

const strokeForRole = (role: string | null): string => {
  if (role === 'accent') return 'var(--accent)'
  if (role === 'muted') return 'var(--soft)'

  return 'var(--fg)'
}

// Input token (left)
const IN_X = 30
const IN_Y = 80
const IN_W = 200
const IN_H = 220

// Worker boxes (middle)
const WORKER_X = 380
const WORKER_W = 170
const WORKER_H = 60
const WORKERS: { y: number; label: string; role: string }[] = [
  { y: 50, label: 'agent A', role: 'file-a' },
  { y: 160, label: 'agent B', role: 'file-c' },
  { y: 270, label: 'agent C', role: 'file-e' },
]

// Output token (right)
const OUT_X = 690
const OUT_Y = 80
const OUT_W = 200
const OUT_H = 220

// Input token slices: 3 horizontal bands matching workers
const IN_SLICES = [
  { from: 0, to: 0.33, role: 'file-a' },
  { from: 0.33, to: 0.66, role: 'file-c' },
  { from: 0.66, to: 1, role: 'file-e' },
]

// Output token slices: 3 vertical bands (results from each worker)
const OUT_SLICES = [
  { from: 0, to: 0.33, role: 'file-a' },
  { from: 0.33, to: 0.66, role: 'file-c' },
  { from: 0.66, to: 1, role: 'file-e' },
]

const GRID_W = 12
const GRID_H = 13

export function AgentOrchestrationDiagram() {
  // Rough boxes + arrows
  const paths = generateRoughPaths(b => {
    // Input token outline
    b.rectangle(IN_X, IN_Y, IN_W, IN_H)
    // Output token outline (accent)
    b.rectangle(OUT_X, OUT_Y, OUT_W, OUT_H, { strokeWidth: 1.4, role: 'accent' })
    // Worker boxes
    for (const w of WORKERS) {
      b.rectangle(WORKER_X, w.y, WORKER_W, WORKER_H)
    }
    // Scatter — arrows from input token to each worker, one per slice
    for (let i = 0; i < WORKERS.length; i += 1) {
      const slice = IN_SLICES[i]!
      const worker = WORKERS[i]!
      const sy = IN_Y + ((slice.from + slice.to) / 2) * IN_H

      b.arrow(IN_X + IN_W + 6, sy, WORKER_X - 6, worker.y + WORKER_H / 2, {
        strokeWidth: 1,
        roughness: 1.3,
      })
    }
    // Gather — arrows from workers to output token
    for (let i = 0; i < WORKERS.length; i += 1) {
      const slice = OUT_SLICES[i]!
      const worker = WORKERS[i]!
      const sy = OUT_Y + ((slice.from + slice.to) / 2) * OUT_H

      b.arrow(WORKER_X + WORKER_W + 6, worker.y + WORKER_H / 2, OUT_X - 6, sy, {
        strokeWidth: 1,
        roughness: 1.3,
      })
    }
  })

  // Pixel grids inside tokens
  const inputPixels = buildGrayPixels(GRID_W, GRID_H, 'orch-in')
  const outputPixels = buildGrayPixels(GRID_W, GRID_H, 'orch-out')
  const inCellW = IN_W / GRID_W
  const inCellH = IN_H / GRID_H
  const outCellW = OUT_W / GRID_W
  const outCellH = OUT_H / GRID_H

  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Input token pixels */}
      <g>
        {inputPixels.map(p => (
          <rect
            key={`ip-${p.x}-${p.y}`}
            fill={p.color}
            height={inCellH}
            width={inCellW}
            x={IN_X + p.x * inCellW}
            y={IN_Y + p.y * inCellH}
          />
        ))}
      </g>
      {/* Input slice borders (file colors) */}
      <g>
        {IN_SLICES.map((s, i) => (
          <rect
            key={`in-slice-${i}`}
            fill="none"
            height={(s.to - s.from) * IN_H - 6}
            rx={2}
            stroke={`var(--${s.role})`}
            strokeWidth={2.5}
            width={IN_W - 6}
            x={IN_X + 3}
            y={IN_Y + s.from * IN_H + 3}
          />
        ))}
      </g>

      {/* Output token pixels */}
      <g>
        {outputPixels.map(p => (
          <rect
            key={`op-${p.x}-${p.y}`}
            fill={p.color}
            height={outCellH}
            width={outCellW}
            x={OUT_X + p.x * outCellW}
            y={OUT_Y + p.y * outCellH}
          />
        ))}
      </g>
      {/* Output slice borders */}
      <g>
        {OUT_SLICES.map((s, i) => (
          <rect
            key={`out-slice-${i}`}
            fill="none"
            height={(s.to - s.from) * OUT_H - 6}
            rx={2}
            stroke={`var(--${s.role})`}
            strokeWidth={2.5}
            width={OUT_W - 6}
            x={OUT_X + 3}
            y={OUT_Y + s.from * OUT_H + 3}
          />
        ))}
      </g>

      {/* Rough outlines + arrows on top */}
      <g>
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
      </g>

      {/* Labels */}
      <text className="font-mono" fill="var(--fg)" fontSize={12} x={IN_X} y={IN_Y - 24}>
        input.png
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={IN_X} y={IN_Y - 10}>
        slices declared in manifest
      </text>

      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={12}
        textAnchor="end"
        x={OUT_X + OUT_W}
        y={OUT_Y - 24}
      >
        result.png
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="end"
        x={OUT_X + OUT_W}
        y={OUT_Y - 10}
      >
        aggregated · hashable
      </text>

      {WORKERS.map(w => (
        <g key={w.label}>
          <text className="font-mono" fill="var(--fg)" fontSize={12} x={WORKER_X + 12} y={w.y + 22}>
            {w.label}
          </text>
          <text
            className="font-mono"
            fill={`var(--${w.role})`}
            fontSize={10}
            x={WORKER_X + 12}
            y={w.y + 40}
          >
            Range: bytes=…
          </text>
          <text
            className="font-mono"
            fill="var(--soft)"
            fontSize={9}
            x={WORKER_X + 12}
            y={w.y + 53}
          >
            parallel · static URL
          </text>
        </g>
      ))}

      {/* Scatter / gather captions */}
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={(IN_X + IN_W + WORKER_X) / 2}
        y={H - 16}
      >
        scatter · range-fetch slices
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        textAnchor="middle"
        x={(WORKER_X + WORKER_W + OUT_X) / 2}
        y={H - 16}
      >
        gather · encode results
      </text>
    </svg>
  )
}
