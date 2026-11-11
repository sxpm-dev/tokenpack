import { CodeBlock } from '@/components/CodeBlock/CodeBlock'

import { generateRoughPaths } from './rough-paths'

// --- Files panel (left) ---
const FILES_VIEW_W = 240
const FILES_VIEW_H = 360
const FILES_X = 8
const FILES_Y = 12
const FILES_W = FILES_VIEW_W - 16
const FILES_H = FILES_VIEW_H - 24
const FILE_INNER_X = FILES_X + 20
const FILE_INNER_W = FILES_W - 40

const FILES: { role: string; y: number; h: number; label: string }[] = [
  { role: 'file-a', y: 36, h: 42, label: 'app.js' },
  { role: 'file-b', y: 88, h: 26, label: 'header.js' },
  { role: 'file-c', y: 124, h: 26, label: 'footer.js' },
  { role: 'file-d', y: 160, h: 26, label: 'menu.js' },
  { role: 'file-e', y: 196, h: 26, label: 'config.json' },
  { role: 'file-f', y: 232, h: 78, label: 'vendor.js · big' },
]

// --- Chunks panel (right) ---
const CHUNK_VIEW_W = 240
const CHUNK_VIEW_H = 360
const CHUNK_X = 12
const CHUNK_W = CHUNK_VIEW_W - 24
const CHUNK_H = 70
const CHUNK_GAP = 14

const GRID_W = 16
const GRID_H = 6

interface Segment {
  role: string
  from: number
  to: number
}

interface ChunkSpec {
  y: number
  label: string
  segments: Segment[]
}

const CHUNKS: ChunkSpec[] = [
  {
    y: 14,
    label: 'chunk-0',
    segments: [{ role: 'file-a', from: 0, to: 1 }],
  },
  {
    y: 14 + (CHUNK_H + CHUNK_GAP),
    label: 'chunk-1',
    segments: [
      { role: 'file-b', from: 0, to: 0.33 },
      { role: 'file-c', from: 0.33, to: 0.66 },
      { role: 'file-d', from: 0.66, to: 1 },
    ],
  },
  {
    y: 14 + 2 * (CHUNK_H + CHUNK_GAP),
    label: 'chunk-2',
    segments: [
      { role: 'file-e', from: 0, to: 0.35 },
      { role: 'file-f', from: 0.35, to: 1 },
    ],
  },
  {
    y: 14 + 3 * (CHUNK_H + CHUNK_GAP),
    label: 'chunk-3',
    segments: [{ role: 'file-f', from: 0, to: 1 }],
  },
]

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

interface PixelCell {
  x: number
  y: number
  color: string
}

function buildPixels(w: number, h: number, seed: string): PixelCell[] {
  const rng = mulberry32(hashSeed(seed))
  const out: PixelCell[] = []

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const lit = 28 + Math.floor(rng() * 40)

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

const ENCODE_CODE = `import { encode, NodePackBuilder } from '@tokenpack/node'

// Many files in, one router token out.
const result = await encode(
  new NodePackBuilder()
    .withFileSystem('./src'),
  { algo: 'router' },
)

// → app.png · manifest + chunk-0..N
// (planner clusters tiny files,
//  splits big ones across chunks)
await writeFile('app.png', result.bytes)`

function FilesPanel() {
  const paths = generateRoughPaths(b => {
    b.rectangle(FILES_X, FILES_Y, FILES_W, FILES_H)
  })

  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      style={{ maxWidth: FILES_VIEW_W }}
      viewBox={`0 0 ${FILES_VIEW_W} ${FILES_VIEW_H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {FILES.map(f => (
          <rect
            key={f.role}
            fill={`var(--${f.role})`}
            height={f.h}
            opacity={0.62}
            rx={2}
            width={FILE_INNER_W}
            x={FILE_INNER_X}
            y={f.y}
          />
        ))}
      </g>

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
    </svg>
  )
}

function ChunksPanel() {
  const paths = generateRoughPaths(b => {
    for (const chunk of CHUNKS) {
      b.rectangle(CHUNK_X, chunk.y, CHUNK_W, CHUNK_H)
    }
  })

  const cellW = CHUNK_W / GRID_W
  const cellH = CHUNK_H / GRID_H

  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      style={{ maxWidth: CHUNK_VIEW_W }}
      viewBox={`0 0 ${CHUNK_VIEW_W} ${CHUNK_VIEW_H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pixel grids */}
      {CHUNKS.map(chunk => {
        const pixels = buildPixels(GRID_W, GRID_H, `enc-${chunk.label}`)

        return (
          <g key={`px-${chunk.label}`}>
            {pixels.map(p => (
              <rect
                key={`${p.x}-${p.y}`}
                fill={p.color}
                height={cellH}
                width={cellW}
                x={CHUNK_X + p.x * cellW}
                y={chunk.y + p.y * cellH}
              />
            ))}
          </g>
        )
      })}

      {/* Colored file-region borders */}
      {CHUNKS.map(chunk => (
        <g key={`border-${chunk.label}`}>
          {chunk.segments.map((seg, idx) => {
            const segX = CHUNK_X + seg.from * CHUNK_W + 2
            const segW = (seg.to - seg.from) * CHUNK_W - 4

            return (
              <rect
                key={idx}
                fill="none"
                height={CHUNK_H - 6}
                rx={2}
                stroke={`var(--${seg.role})`}
                strokeWidth={2.5}
                width={segW}
                x={segX}
                y={chunk.y + 3}
              />
            )
          })}
        </g>
      ))}

      {/* Rough chunk outlines on top */}
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

      {/* Chunk labels */}
      {CHUNKS.map(chunk => (
        <text
          key={`label-${chunk.label}`}
          className="font-mono"
          fill="var(--soft)"
          fontSize={10}
          textAnchor="end"
          x={CHUNK_X + CHUNK_W - 8}
          y={chunk.y - 4}
        >
          {chunk.label}
        </text>
      ))}
    </svg>
  )
}

export async function RouterEncoderDiagram() {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.8fr)_auto_minmax(0,1.4fr)_auto_minmax(0,0.8fr)] lg:gap-8">
      {/* Left — files */}
      <div className="flex flex-col items-center gap-3">
        <div className="self-start font-mono text-[10px] tracking-[0.18em] text-tp-soft uppercase">
          N files · input
        </div>
        <FilesPanel />
      </div>

      <div className="hidden items-center justify-center lg:flex">
        <span className="font-mono text-[28px] leading-none text-tp-accent">→</span>
      </div>

      {/* Middle — encode() snippet */}
      <div className="min-w-0">
        <CodeBlock code={ENCODE_CODE} lang="ts" />
      </div>

      <div className="hidden items-center justify-center lg:flex">
        <span className="font-mono text-[28px] leading-none text-tp-accent">→</span>
      </div>

      {/* Right — chunks */}
      <div className="flex flex-col items-center gap-3">
        <div className="self-start font-mono text-[10px] tracking-[0.18em] text-tp-soft uppercase">
          router token · output
        </div>
        <ChunksPanel />
      </div>
    </div>
  )
}
