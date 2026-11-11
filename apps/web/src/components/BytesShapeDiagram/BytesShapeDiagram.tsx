// Plain-language twin of HowItWorks/AlgorithmComparison's two visuals.
// Used on the Tokens story pages. Avoids implementation labels (no tpAK / chunk codes).

const VIS_W = 240
const VIS_H = 150
const GRID_W = 16
const GRID_H = 10

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

function PixelsAreDataVisual() {
  const rng = mulberry32(hashSeed('bytes-shape-linear'))
  const cellW = VIS_W / GRID_W
  const cellH = VIS_H / GRID_H
  const cells: { x: number; y: number; color: string }[] = []

  for (let y = 0; y < GRID_H; y += 1) {
    for (let x = 0; x < GRID_W; x += 1) {
      const hue = Math.floor(rng() * 360)
      const sat = 35 + Math.floor(rng() * 35)
      const lit = 38 + Math.floor(rng() * 28)

      cells.push({ x, y, color: `hsl(${hue} ${sat}% ${lit}%)` })
    }
  }

  return (
    <svg
      aria-hidden="true"
      className="mx-auto block w-full"
      style={{ maxWidth: VIS_W }}
      viewBox={`0 0 ${VIS_W} ${VIS_H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {cells.map(p => (
        <rect
          key={`${p.x}-${p.y}`}
          fill={p.color}
          height={cellH}
          width={cellW}
          x={p.x * cellW}
          y={p.y * cellH}
        />
      ))}
      <rect fill="var(--accent)" height={VIS_H} opacity={0.12} width={VIS_W} x={0} y={0} />
      <rect
        fill="none"
        height={VIS_H - 4}
        rx={2}
        stroke="var(--accent)"
        strokeDasharray="4 3"
        strokeWidth={2}
        width={VIS_W - 4}
        x={2}
        y={2}
      />
    </svg>
  )
}

function PixelsAreDecorationVisual() {
  const slotX = VIS_W * 0.08
  const slotY = VIS_H * 0.18
  const slotW = VIS_W * 0.4
  const slotH = VIS_H * 0.5

  return (
    <svg
      aria-hidden="true"
      className="mx-auto block w-full"
      style={{ maxWidth: VIS_W }}
      viewBox={`0 0 ${VIS_W} ${VIS_H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bytes-shape-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="var(--file-a)" />
          <stop offset="35%" stopColor="var(--accent)" />
          <stop offset="70%" stopColor="var(--file-c)" />
          <stop offset="100%" stopColor="var(--file-b)" />
        </linearGradient>
      </defs>

      <rect fill="url(#bytes-shape-gradient)" height={VIS_H} width={VIS_W} x={0} y={0} />
      <rect fill="var(--bg)" height={VIS_H} opacity={0.1} width={VIS_W} x={0} y={0} />

      <rect
        fill="var(--bg)"
        height={slotH}
        opacity={0.7}
        rx={4}
        width={slotW}
        x={slotX}
        y={slotY}
      />
      <rect
        fill="none"
        height={slotH}
        rx={4}
        stroke="var(--accent)"
        strokeWidth={2}
        width={slotW}
        x={slotX}
        y={slotY}
      />
    </svg>
  )
}

interface Card {
  eyebrow: string
  title: string
  body: string
  caption: string
  visual: React.ReactNode
}

const CARDS: Card[] = [
  {
    eyebrow: 'Linear',
    title: 'Bytes are the pixels.',
    body: 'Every byte of the payload is written directly into the pixels of the image. Decoding the image means reading the bytes back, one after another.',
    caption: 'the image is the data',
    visual: <PixelsAreDataVisual />,
  },
  {
    eyebrow: 'Pixel-range',
    title: 'Bytes sit in a slot inside the image.',
    body: 'The payload lives at a fixed, known spot inside the image file. The pixels themselves are just decoration — a cover image you can show, ignore, or replace.',
    caption: 'pixels are decoration · payload has its own slot',
    visual: <PixelsAreDecorationVisual />,
  },
]

export function BytesShapeDiagram() {
  return (
    <div className="grid gap-6 rounded-2xl border border-tp-border bg-tp-elev p-6 sm:p-8 lg:grid-cols-2 lg:gap-10">
      {CARDS.map(card => (
        <article key={card.eyebrow} className="flex flex-col gap-5">
          <header className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] tracking-[0.14em] text-tp-soft uppercase">
              {card.eyebrow}
            </span>
            <span className="h-px flex-1 bg-tp-border" />
          </header>

          <h3 className="text-[18px] leading-tight font-medium tracking-tight">{card.title}</h3>

          <div className="rounded-lg border border-tp-border bg-tp-bg p-4">{card.visual}</div>

          <p className="text-center font-mono text-[11px] text-tp-soft">{card.caption}</p>

          <p className="text-[14px] leading-relaxed text-tp-muted">{card.body}</p>
        </article>
      ))}
    </div>
  )
}
