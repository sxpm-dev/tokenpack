import { generateRoughPaths } from './rough-paths'

const W = 940
const H = 360

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
function buildGray(w: number, h: number, seed: string) {
  const rng = mulberry32(hashSeed(seed))
  const out: { x: number; y: number; color: string }[] = []

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const lit = 28 + Math.floor(rng() * 38)

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

// Layout
const TOKEN_W = 160
const TOKEN_H = 180
const TOKEN_Y = 80
const TOKEN_X = {
  v1: 30,
  diff: 270,
  v2: 510,
  apply: 750,
}
const GRID_W = 10
const GRID_H = 12

interface TokenProps {
  x: number
  y: number
  w: number
  h: number
  seed: string
  accent?: boolean
  fileColors?: { from: number; to: number; role: string }[]
  size?: { gridW: number; gridH: number }
}

export function DiffApplyDiagram() {
  const tokens: (TokenProps & { gridSeed: string })[] = [
    {
      x: TOKEN_X.v1,
      y: TOKEN_Y,
      w: TOKEN_W,
      h: TOKEN_H,
      seed: 'diff-v1',
      gridSeed: 'diff-v1-grid',
      fileColors: [
        { from: 0, to: 0.33, role: 'file-a' },
        { from: 0.33, to: 0.66, role: 'file-b' },
        { from: 0.66, to: 1, role: 'file-c' },
      ],
    },
    {
      x: TOKEN_X.diff,
      y: TOKEN_Y + 30,
      w: TOKEN_W,
      h: TOKEN_H - 60,
      seed: 'diff-token',
      gridSeed: 'diff-token-grid',
      accent: true,
      fileColors: [],
    },
    {
      x: TOKEN_X.v2,
      y: TOKEN_Y,
      w: TOKEN_W,
      h: TOKEN_H,
      seed: 'diff-v2',
      gridSeed: 'diff-v2-grid',
      fileColors: [
        // v2 has c.js modified + d.js added; b.js removed
        { from: 0, to: 0.33, role: 'file-a' },
        { from: 0.33, to: 0.66, role: 'file-c' },
        { from: 0.66, to: 1, role: 'file-d' },
      ],
    },
  ]

  const paths = generateRoughPaths(b => {
    // v1 token outline
    b.rectangle(TOKEN_X.v1, TOKEN_Y, TOKEN_W, TOKEN_H)
    // diff token outline — accent
    b.rectangle(TOKEN_X.diff, TOKEN_Y + 30, TOKEN_W, TOKEN_H - 60, {
      strokeWidth: 1.4,
      role: 'accent',
    })
    // v2 token outline
    b.rectangle(TOKEN_X.v2, TOKEN_Y, TOKEN_W, TOKEN_H)
    // arrows: v1 → "+ diff", diff → "= v2"
    b.arrow(
      TOKEN_X.v1 + TOKEN_W + 8,
      TOKEN_Y + TOKEN_H / 2,
      TOKEN_X.diff - 8,
      TOKEN_Y + TOKEN_H / 2,
      {
        strokeWidth: 1.1,
        roughness: 1.3,
      },
    )
    b.arrow(
      TOKEN_X.diff + TOKEN_W + 8,
      TOKEN_Y + TOKEN_H / 2,
      TOKEN_X.v2 - 8,
      TOKEN_Y + TOKEN_H / 2,
      { strokeWidth: 1.1, roughness: 1.3 },
    )
    // "+" between v1 and diff
    b.line(
      TOKEN_X.v1 + TOKEN_W + 28,
      TOKEN_Y + TOKEN_H / 2 - 8,
      TOKEN_X.v1 + TOKEN_W + 28,
      TOKEN_Y + TOKEN_H / 2 + 8,
      {
        strokeWidth: 1.2,
      },
    )
    b.line(
      TOKEN_X.v1 + TOKEN_W + 20,
      TOKEN_Y + TOKEN_H / 2,
      TOKEN_X.v1 + TOKEN_W + 36,
      TOKEN_Y + TOKEN_H / 2,
      {
        strokeWidth: 1.2,
      },
    )
    // "=" between diff and v2
    b.line(
      TOKEN_X.diff + TOKEN_W + 20,
      TOKEN_Y + TOKEN_H / 2 - 5,
      TOKEN_X.diff + TOKEN_W + 36,
      TOKEN_Y + TOKEN_H / 2 - 5,
      {
        strokeWidth: 1.2,
      },
    )
    b.line(
      TOKEN_X.diff + TOKEN_W + 20,
      TOKEN_Y + TOKEN_H / 2 + 5,
      TOKEN_X.diff + TOKEN_W + 36,
      TOKEN_Y + TOKEN_H / 2 + 5,
      {
        strokeWidth: 1.2,
      },
    )
  })

  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Header */}
      <text className="font-mono" fill="var(--soft)" fontSize={11} x={TOKEN_X.v1} y={40}>
        baseline + diff = next version. real example:
      </text>
      <text className="font-mono" fill="var(--fg)" fontSize={12} x={TOKEN_X.v1} y={58}>
        app@1.0.0 (3.2 MB) + app-1.0.1-diff (4.8 KB) = app@1.0.1
      </text>

      {/* Pixel grids inside tokens */}
      {tokens.map(t => {
        const pixels = buildGray(GRID_W, GRID_H, t.gridSeed)
        const cellW = t.w / GRID_W
        const cellH = t.h / GRID_H

        return (
          <g key={t.gridSeed}>
            {pixels.map(p => (
              <rect
                key={`${t.gridSeed}-${p.x}-${p.y}`}
                fill={p.color}
                height={cellH}
                width={cellW}
                x={t.x + p.x * cellW}
                y={t.y + p.y * cellH}
              />
            ))}
            {/* file-region borders */}
            {(t.fileColors ?? []).map((seg, i) => (
              <rect
                key={`${t.gridSeed}-seg-${i}`}
                fill="none"
                height={(seg.to - seg.from) * t.h - 4}
                rx={2}
                stroke={`var(--${seg.role})`}
                strokeWidth={2.4}
                width={t.w - 4}
                x={t.x + 2}
                y={t.y + seg.from * t.h + 2}
              />
            ))}
          </g>
        )
      })}

      {/* Rough outlines + symbols */}
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

      {/* Token captions */}
      <text className="font-mono" fill="var(--fg)" fontSize={11} x={TOKEN_X.v1} y={TOKEN_Y - 6}>
        v1.0.0 · baseline
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        x={TOKEN_X.v1}
        y={TOKEN_Y + TOKEN_H + 16}
      >
        3.2 MB · cached
      </text>

      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={11}
        x={TOKEN_X.diff}
        y={TOKEN_Y - 6}
      >
        diff.png · 4.8 KB
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        x={TOKEN_X.diff}
        y={TOKEN_Y + TOKEN_H + 16}
      >
        +1 file · ~1 modified · −1
      </text>

      <text className="font-mono" fill="var(--fg)" fontSize={11} x={TOKEN_X.v2} y={TOKEN_Y - 6}>
        v1.0.1 · reconstructed
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        x={TOKEN_X.v2}
        y={TOKEN_Y + TOKEN_H + 16}
      >
        3.2 MB · re-hashed
      </text>

      {/* Diff ops inside the diff token */}
      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={11}
        x={TOKEN_X.diff + 20}
        y={TOKEN_Y + 60}
      >
        + d.js
      </text>
      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={11}
        x={TOKEN_X.diff + 20}
        y={TOKEN_Y + 80}
      >
        ~ c.js
      </text>
      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={11}
        x={TOKEN_X.diff + 20}
        y={TOKEN_Y + 100}
      >
        − b.js
      </text>

      {/* Right callout — apply scenario */}
      <text className="font-mono" fill="var(--fg)" fontSize={12} x={TOKEN_X.apply} y={TOKEN_Y + 10}>
        Apply
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        x={TOKEN_X.apply}
        y={TOKEN_Y + 30}
      >
        on each release
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        x={TOKEN_X.apply}
        y={TOKEN_Y + 60}
      >
        ① client has 1.0.0 cached
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        x={TOKEN_X.apply}
        y={TOKEN_Y + 78}
      >
        ② fetch 4.8 KB diff
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={10}
        x={TOKEN_X.apply}
        y={TOKEN_Y + 96}
      >
        ③ apply locally → 1.0.1
      </text>
      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={11}
        x={TOKEN_X.apply}
        y={TOKEN_Y + 124}
      >
        ~1500× less bandwidth
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={9}
        x={TOKEN_X.apply}
        y={TOKEN_Y + 140}
      >
        vs re-downloading the full bundle
      </text>
    </svg>
  )
}
