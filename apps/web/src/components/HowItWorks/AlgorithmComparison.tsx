interface PixelCell {
  x: number
  y: number
  color: string
}

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

function buildColorPixels(w: number, h: number, seed: string): PixelCell[] {
  const rng = mulberry32(hashSeed(seed))
  const out: PixelCell[] = []

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const hue = Math.floor(rng() * 360)
      const sat = 35 + Math.floor(rng() * 35)
      const lit = 38 + Math.floor(rng() * 28)

      out.push({ x, y, color: `hsl(${hue} ${sat}% ${lit}%)` })
    }
  }

  return out
}

const VIS_W = 240
const VIS_H = 150
const GRID_W = 16
const GRID_H = 10

export function LinearVisual() {
  const pixels = buildColorPixels(GRID_W, GRID_H, 'algo-linear')
  const cellW = VIS_W / GRID_W
  const cellH = VIS_H / GRID_H

  return (
    <svg
      aria-hidden="true"
      className="mx-auto block w-full"
      style={{ maxWidth: VIS_W }}
      viewBox={`0 0 ${VIS_W} ${VIS_H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {pixels.map(p => (
        <rect
          key={`${p.x}-${p.y}`}
          fill={p.color}
          height={cellH}
          width={cellW}
          x={p.x * cellW}
          y={p.y * cellH}
        />
      ))}
      {/* Accent-colored overlay shows "data" extends across the whole pixel grid */}
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

export function PixelRangeVisual() {
  // The pixels are decoration for pixel-range tokens; the bytes live in tpAK.
  const tpakX = VIS_W * 0.08
  const tpakY = VIS_H * 0.12
  const tpakW = VIS_W * 0.4
  const tpakH = VIS_H * 0.5

  return (
    <svg
      aria-hidden="true"
      className="mx-auto block w-full"
      style={{ maxWidth: VIS_W }}
      viewBox={`0 0 ${VIS_W} ${VIS_H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pixel-range-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="var(--file-a)" />
          <stop offset="35%" stopColor="var(--accent)" />
          <stop offset="70%" stopColor="var(--file-c)" />
          <stop offset="100%" stopColor="var(--file-b)" />
        </linearGradient>
      </defs>

      <rect fill="url(#pixel-range-gradient)" height={VIS_H} width={VIS_W} x={0} y={0} />
      <rect fill="var(--bg)" height={VIS_H} opacity={0.1} width={VIS_W} x={0} y={0} />
      {/* tpAK side-channel — the actual payload lives here */}
      <rect
        fill="var(--bg)"
        height={tpakH}
        opacity={0.65}
        rx={4}
        width={tpakW}
        x={tpakX}
        y={tpakY}
      />
      <rect
        fill="none"
        height={tpakH}
        rx={4}
        stroke="var(--accent)"
        strokeWidth={2}
        width={tpakW}
        x={tpakX}
        y={tpakY}
      />
      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={11}
        textAnchor="middle"
        x={tpakX + tpakW / 2}
        y={tpakY + tpakH / 2 - 2}
      >
        tpAK
      </text>
      <text
        className="font-mono"
        fill="var(--fg)"
        fontSize={9}
        textAnchor="middle"
        x={tpakX + tpakW / 2}
        y={tpakY + tpakH / 2 + 12}
      >
        data
      </text>
    </svg>
  )
}

interface CompareRow {
  format: string
  wire: string
  streaming: 'yes' | 'http-only' | 'no'
  range: 'yes' | 'partial' | 'no'
  vision: 'yes' | 'no'
  manifest: 'yes' | 'central-dir' | 'no'
  accent?: boolean
}

const COMPARE_ROWS: CompareRow[] = [
  {
    format: 'zip',
    wire: '176 KB',
    streaming: 'no',
    range: 'no',
    vision: 'no',
    manifest: 'central-dir',
  },
  {
    format: 'tar.gz',
    wire: '175 KB',
    streaming: 'no',
    range: 'no',
    vision: 'no',
    manifest: 'no',
  },
  {
    format: 'brotli-6 (raw)',
    wire: '155 KB',
    streaming: 'http-only',
    range: 'no',
    vision: 'no',
    manifest: 'no',
  },
  {
    format: 'brotli-11 (raw)',
    wire: '134 KB',
    streaming: 'http-only',
    range: 'no',
    vision: 'no',
    manifest: 'no',
  },
  {
    format: 'TokenPack linear-deflate',
    wire: '134 KB',
    streaming: 'yes',
    range: 'no',
    vision: 'no',
    manifest: 'no',
    accent: true,
  },
  {
    format: 'TokenPack pixel-range',
    wire: '~140 KB',
    streaming: 'yes',
    range: 'yes',
    vision: 'yes',
    manifest: 'yes',
    accent: true,
  },
]

function Mark({
  value,
}: {
  value:
    | CompareRow['streaming']
    | CompareRow['range']
    | CompareRow['vision']
    | CompareRow['manifest']
}) {
  if (value === 'yes') return <span className="font-mono text-tp-accent">●</span>
  if (value === 'no') return <span className="font-mono text-tp-soft">○</span>

  return <span className="font-mono text-[11px] text-tp-muted">{value}</span>
}

function ArchiveComparison() {
  return (
    <div className="overflow-x-auto rounded-lg border border-tp-border">
      <table className="w-full min-w-[720px] text-[13px]">
        <thead>
          <tr className="border-b border-tp-border bg-tp-elev text-[10px] tracking-[0.12em] text-tp-muted uppercase">
            <th className="px-4 py-3 text-left font-medium">Format</th>
            <th className="px-4 py-3 text-right font-medium">Wire size · 1 MB JS</th>
            <th className="px-4 py-3 text-center font-medium">Stream</th>
            <th className="px-4 py-3 text-center font-medium">Range</th>
            <th className="px-4 py-3 text-center font-medium">Vision-readable</th>
            <th className="px-4 py-3 text-center font-medium">Manifest</th>
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map(row => (
            <tr
              key={row.format}
              className={`border-b border-tp-border/50 last:border-b-0 ${row.accent ? 'bg-tp-mark/10' : 'bg-tp-bg'}`}
            >
              <td className="px-4 py-3 text-tp-fg">
                <div className="flex items-center gap-2">
                  {row.accent && (
                    <span className="rounded-full bg-tp-accent px-1.5 py-px font-mono text-[9px] tracking-wider text-tp-accent-fg uppercase">
                      tp
                    </span>
                  )}
                  <span className={row.accent ? 'font-medium' : ''}>{row.format}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-tp-fg">{row.wire}</td>
              <td className="px-4 py-3 text-center">
                <Mark value={row.streaming} />
              </td>
              <td className="px-4 py-3 text-center">
                <Mark value={row.range} />
              </td>
              <td className="px-4 py-3 text-center">
                <Mark value={row.vision} />
              </td>
              <td className="px-4 py-3 text-center">
                <Mark value={row.manifest} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface StageProps {
  n: string
  tag: string
  heading: string
  body: React.ReactNode
  visual: React.ReactNode
}

function Stage({ n, tag, heading, body, visual }: StageProps) {
  return (
    <article className="grid items-start gap-8 border-b border-tp-border pb-12 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] text-tp-soft">{n}</span>
          <span className="rounded-full border border-tp-border bg-tp-elev px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-tp-muted uppercase">
            {tag}
          </span>
        </div>
        <h4 className="max-w-md text-[20px] leading-[1.2] font-medium tracking-[-0.015em]">
          {heading}
        </h4>
        <div className="prose-tp max-w-md text-[13.5px] leading-relaxed text-tp-muted">{body}</div>
      </header>
      <div className="rounded-md border border-tp-border bg-tp-elev p-5">{visual}</div>
    </article>
  )
}

// --- Stage visuals ---

const FILE_BARS = [
  { role: 'file-a', h: 16, label: 'readme.md', size: '1.2 KB' },
  { role: 'file-b', h: 30, label: 'app.js', size: '180 KB' },
  { role: 'file-c', h: 20, label: 'styles.css', size: '24 KB' },
  { role: 'file-d', h: 12, label: 'config.json', size: '0.8 KB' },
  { role: 'file-e', h: 44, label: 'vendor.js', size: '2.3 MB · big' },
]

function InputVisual() {
  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      viewBox="0 0 360 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={16} y={22}>
        input
      </text>
      <text className="font-mono" fill="var(--fg)" fontSize={11} x={300} y={22}>
        size
      </text>
      {
        FILE_BARS.reduce<{ top: number; nodes: React.ReactNode[] }>(
          (acc, f) => {
            const top = acc.top

            acc.nodes.push(
              <g key={f.label}>
                <rect
                  fill={`var(--${f.role})`}
                  height={f.h}
                  opacity={0.7}
                  rx={2}
                  width={220}
                  x={16}
                  y={top}
                />
                <text
                  className="font-mono"
                  fill="var(--fg)"
                  fontSize={10}
                  x={244}
                  y={top + f.h / 2 + 4}
                >
                  {f.label}
                </text>
                <text
                  className="font-mono"
                  fill="var(--soft)"
                  fontSize={9}
                  textAnchor="end"
                  x={344}
                  y={top + f.h / 2 + 4}
                >
                  {f.size}
                </text>
              </g>,
            )

            return { top: top + f.h + 8, nodes: acc.nodes }
          },
          { top: 36, nodes: [] },
        ).nodes
      }
    </svg>
  )
}

function SplitVisual() {
  // Big file (vendor.js · 2.3 MB) splits into 3 chunks (~1 MB each)
  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      viewBox="0 0 360 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={16} y={20}>
        one big file
      </text>
      <rect fill="var(--file-e)" height={28} opacity={0.7} rx={2} width={260} x={16} y={32} />
      <text className="font-mono" fill="var(--fg)" fontSize={10} x={20} y={50}>
        vendor.js · 2.3 MB
      </text>

      {/* arrow down */}
      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={22}
        textAnchor="middle"
        x={150}
        y={92}
      >
        ↓
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={9} x={170} y={88}>
        split at 1 MB chunks
      </text>

      <text className="font-mono" fill="var(--soft)" fontSize={10} x={16} y={120}>
        three chunks
      </text>

      {[0, 1, 2].map(i => (
        <g key={i}>
          <rect
            fill="var(--file-e)"
            height={20}
            opacity={0.7}
            rx={2}
            width={86}
            x={16 + i * 90}
            y={130}
          />
          <text className="font-mono" fill="var(--fg)" fontSize={9} x={16 + i * 90 + 8} y={144}>
            seg {i}
          </text>
          <text
            className="font-mono"
            fill="var(--soft)"
            fontSize={9}
            textAnchor="end"
            x={16 + i * 90 + 82}
            y={144}
          >
            1 MB
          </text>
        </g>
      ))}

      <text className="font-mono" fill="var(--soft)" fontSize={9} x={16} y={172}>
        manifest records fileOffset hints so the consumer reassembles by path
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={9} x={16} y={186}>
        (router tokens only · single-file tokens skip this)
      </text>
    </svg>
  )
}

function CompressVisual() {
  return (
    <svg
      aria-hidden="true"
      className="block h-auto w-full"
      viewBox="0 0 360 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Before bar */}
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={16} y={24}>
        before
      </text>
      <rect fill="var(--file-b)" height={20} opacity={0.55} rx={2} width={280} x={16} y={34} />
      <text className="font-mono" fill="var(--fg)" fontSize={10} x={304} y={48}>
        180 KB
      </text>

      {/* Compress box */}
      <rect
        fill="none"
        height={42}
        rx={4}
        stroke="var(--accent)"
        strokeWidth={1.4}
        width={180}
        x={90}
        y={74}
      />
      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={12}
        textAnchor="middle"
        x={180}
        y={92}
      >
        compress
      </text>
      <text
        className="font-mono"
        fill="var(--soft)"
        fontSize={9}
        textAnchor="middle"
        x={180}
        y={108}
      >
        deflate · browser · brotli-11 · node
      </text>

      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={18}
        textAnchor="middle"
        x={180}
        y={138}
      >
        ↓
      </text>

      {/* After bar */}
      <text className="font-mono" fill="var(--soft)" fontSize={10} x={16} y={158}>
        after
      </text>
      <rect fill="var(--file-b)" height={20} opacity={0.85} rx={2} width={70} x={16} y={168} />
      <text className="font-mono" fill="var(--fg)" fontSize={10} x={94} y={182}>
        46 KB
      </text>
      <text className="font-mono" fill="var(--soft)" fontSize={9} x={156} y={182}>
        ~4× smaller · ready for the carrier
      </text>
    </svg>
  )
}

export function PixelByteCallout() {
  // One zoomed pixel showing R G B A → 4 ASCII bytes (spells "pack")
  const channels = [
    { letter: 'R', byte: 'p', color: '#ef4444' },
    { letter: 'G', byte: 'a', color: '#22c55e' },
    { letter: 'B', byte: 'c', color: '#3b82f6' },
    { letter: 'A', byte: 'k', color: '#9ca3af' },
  ]

  return (
    <div className="mx-auto flex w-full max-w-[260px] flex-col items-center gap-2.5 text-center font-mono">
      <div className="text-[10px] text-tp-soft">one pixel · 4 bytes</div>
      <div className="grid grid-cols-4 gap-1.5">
        {channels.map(c => (
          <div
            key={c.letter}
            className="flex h-12 w-12 flex-col items-center justify-center rounded-md text-white"
            style={{ backgroundColor: c.color, opacity: 0.9 }}
          >
            <span className="text-[10px] leading-none opacity-85">{c.letter}</span>
            <span className="mt-1 text-[14px] leading-none font-semibold">{c.byte}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-tp-soft">each channel = one byte = one ASCII symbol</div>
      <div className="text-[10px] text-tp-accent">bytes stream channel by channel</div>
    </div>
  )
}

export function TpakBytesCallout() {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-1.5 text-center font-mono">
      <div className="text-[10px] text-tp-soft">
        pixels = decoration (gradient, art, placeholder)
      </div>
      <div className="text-[11px] text-tp-accent">
        tpAK chunk holds real bytes at stable file offsets
      </div>
      <div className="text-[10px] text-tp-soft">
        consumer HTTP-Range fetches just the offset it needs
      </div>
    </div>
  )
}

function WriteStrategiesVisual() {
  return (
    <div className="grid gap-px overflow-hidden rounded-md border border-tp-border bg-tp-border lg:grid-cols-2">
      {/* 04a — linear-deflate */}
      <div className="flex flex-col gap-3 bg-tp-bg p-5">
        <div className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
          04a · pixels carry data
        </div>
        <div className="text-[14px] font-medium tracking-tight">linear-deflate</div>
        <LinearVisual />
        <PixelByteCallout />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['linear', 'linear-deflate', 'linear-stream-deflate'].map(n => (
            <span
              key={n}
              className="inline-block rounded-full border border-tp-border bg-tp-elev px-2 py-0.5 font-mono text-[10.5px] text-tp-muted"
            >
              {n}
            </span>
          ))}
        </div>
      </div>
      {/* 04b — pixel-range */}
      <div className="flex flex-col gap-3 bg-tp-bg p-5">
        <div className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
          04b · bytes in a side channel
        </div>
        <div className="text-[14px] font-medium tracking-tight">pixel-range</div>
        <PixelRangeVisual />
        <TpakBytesCallout />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['pixel-range-none', 'pixel-range-deflate', 'pixel-range-png-brotli'].map(n => (
            <span
              key={n}
              className="inline-block rounded-full border border-tp-border bg-tp-elev px-2 py-0.5 font-mono text-[10.5px] text-tp-muted"
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function EncodeFlow() {
  return (
    <div className="flex flex-col gap-12 rounded-lg border border-tp-border bg-tp-bg p-8">
      <Stage
        body={
          <>
            <p>
              Your input — text, a file, a directory, a builder — arrives as one or many byte
              streams. Each stream is a logical file with a path: <code>readme.md</code>,{' '}
              <code>app.js</code>, <code>vendor.js</code>. No transport, no schema, no metadata tax
              yet — just bytes with names.
            </p>
          </>
        }
        heading="Files come in. Bytes with names."
        n="01"
        tag="Input"
        visual={<InputVisual />}
      />

      <Stage
        body={
          <>
            <p>
              Only router tokens need this step. Files larger than <code>targetChunkBytes</code>{' '}
              (default 1 MB) split into segments so the consumer can fetch them in parallel. Files
              smaller than <code>tinyFileBytes</code> (default 32 KB) get clustered contiguously
              into a shared chunk for burst prefetch.
            </p>
            <p>
              The manifest records each file&apos;s segments and offsets — at decode time the
              runtime reassembles by path.
            </p>
          </>
        }
        heading="Big files split. Tiny files cluster."
        n="02"
        tag="Split (router only)"
        visual={<SplitVisual />}
      />

      <Stage
        body={
          <>
            <p>
              Each file gets compressed independently. <strong>Browser:</strong>{' '}
              <code>CompressionStream(&apos;deflate&apos;)</code> — native, no library tax.{' '}
              <strong>Node:</strong> <code>brotli-11</code> by default — slower at encode, ~10%
              smaller wire.
            </p>
            <p>
              Per-file compression matters at decode time: the consumer can pull{' '}
              <code>vendor.js</code> alone without inflating the whole bundle. The choice of
              compressor is independent of the carrier — both work with both write strategies below.
            </p>
          </>
        }
        heading="Compress per file. Wire size drops 3–5×."
        n="03"
        tag="Compress"
        visual={<CompressVisual />}
      />

      <Stage
        body={
          <>
            <p>
              Now the bytes have to <em>live somewhere inside the Image Token</em>. Two strategies.
              Different trade-offs.
            </p>
            <p>
              <strong className="text-tp-fg">04a · pixels carry data.</strong> Compressed bytes are
              written straight into the pixel buffer — every R, G, B, A channel of every pixel is
              one byte of the payload. The image <em>is</em> the data. Smallest wire size; streams
              during image decode.
            </p>
            <p>
              <strong className="text-tp-fg">04b · bytes in a side channel.</strong> Compressed
              bytes are written into a private image side channel (<code>tpAK</code>). The pixels
              are pure decoration — you can render a gradient, data-art, anything. Bytes live at
              stable offsets, range-fetchable, agent-readable.
            </p>
          </>
        }
        heading="Write into the Image Token — two strategies."
        n="04"
        tag="Write to image"
        visual={<WriteStrategiesVisual />}
      />
    </div>
  )
}

export function AlgorithmComparison() {
  return (
    <div className="flex flex-col gap-10">
      <EncodeFlow />

      {/* Comparison vs regular archives */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
            vs ordinary compression
          </span>
          <span className="h-px flex-1 bg-tp-border" />
          <span className="font-mono text-[10px] text-tp-soft">
            ● supported · ○ not without a wrapper
          </span>
        </div>
        <ArchiveComparison />
        <p className="text-[12.5px] leading-relaxed text-tp-muted">
          Zip and tar.gz are good at <em>archiving</em>. brotli is good at <em>compressing</em>.
          TokenPack is good at <em>distribution</em> — wire size on par with brotli-11, but the
          artifact streams during transfer, supports HTTP Range, carries a JSON manifest, and (for
          pixel-range) gives vision-capable agents direct byte access.
        </p>
      </div>
    </div>
  )
}
