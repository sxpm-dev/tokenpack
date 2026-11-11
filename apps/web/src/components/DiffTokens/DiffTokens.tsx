import { CodeBlock } from '@/components/CodeBlock/CodeBlock'

const STEPS = [
  {
    label: '01 · base token',
    code: `const baseToken = await encode(baseBuilder)
const basePack = await decode(baseToken.bytes)`,
  },
  {
    label: '02 · code → diff token',
    code: `const nextToken = await encode(nextBuilder)
const nextPack = await decode(nextToken.bytes)

const diffToken = await basePack.diffTo(nextPack)`,
  },
  {
    label: '03 · base + diff',
    code: `const diffPack = await decode(diffToken.bytes)
const finalPack = await basePack.apply(diffPack)

await finalPack.list()
await finalPack.text('src/app.ts')`,
  },
]

const TOKEN_W = 144
const TOKEN_H = 144
const GRID = 8
const CELL = TOKEN_W / GRID
const PATCHES = [
  { x: 1, y: 1, w: 2, h: 2, color: 'var(--file-a)', label: '+ docs.md' },
  { x: 5, y: 2, w: 2, h: 3, color: 'var(--file-c)', label: '~ app.ts' },
  { x: 2, y: 6, w: 3, h: 1, color: 'var(--file-d)', label: '- old.ts' },
]

function cellColor(x: number, y: number, seed: number) {
  const hue = (x * 37 + y * 53 + seed) % 360
  const sat = 32 + ((x + y + seed) % 18)
  const lit = 34 + ((x * 11 + y * 7 + seed) % 22)

  return `hsl(${hue} ${sat}% ${lit}%)`
}

function isPatchCell(x: number, y: number) {
  return PATCHES.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h)
}

function TokenGrid({ mode }: { mode: 'base' | 'diff' | 'result' }) {
  return (
    <g>
      {Array.from({ length: GRID * GRID }, (_, index) => {
        const x = index % GRID
        const y = Math.floor(index / GRID)
        const patch = isPatchCell(x, y)
        const fill =
          mode === 'diff'
            ? patch
              ? patch.color
              : 'var(--elev2)'
            : mode === 'result' && patch
              ? patch.color
              : cellColor(x, y, 18)
        const opacity = mode === 'diff' && !patch ? 0.22 : 1

        return (
          <rect
            key={`${mode}-${x}-${y}`}
            fill={fill}
            height={CELL}
            opacity={opacity}
            width={CELL}
            x={x * CELL}
            y={y * CELL}
          />
        )
      })}
    </g>
  )
}

function PatchBorders({ inset = 2, strokeWidth = 2 }: { inset?: number; strokeWidth?: number }) {
  return (
    <g>
      {PATCHES.map(patch => (
        <g key={patch.label}>
          <rect
            fill="none"
            height={patch.h * CELL - inset * 2}
            rx={2}
            stroke="var(--bg)"
            strokeWidth={strokeWidth + 2}
            width={patch.w * CELL - inset * 2}
            x={patch.x * CELL + inset}
            y={patch.y * CELL + inset}
          />
          <rect
            fill="none"
            height={patch.h * CELL - inset * 2}
            rx={2}
            stroke="var(--fg)"
            strokeWidth={strokeWidth}
            width={patch.w * CELL - inset * 2}
            x={patch.x * CELL + inset}
            y={patch.y * CELL + inset}
          />
        </g>
      ))}
    </g>
  )
}

function DiffTokenFlow() {
  return (
    <div className="overflow-hidden rounded-lg border border-tp-border bg-tp-elev2 p-5">
      <h3 className="mb-6 font-mono text-[14px] leading-snug text-tp-fg">
        apply diff token to baseline to get next version token
      </h3>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <div className="grid justify-items-center gap-3">
          <div className="font-mono text-[12px] text-tp-fg">baseline token</div>
          <svg
            aria-label="Baseline token"
            className="h-auto w-full max-w-[180px]"
            role="img"
            viewBox={`0 0 ${TOKEN_W} ${TOKEN_H}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <TokenGrid mode="base" />
          </svg>
          <div className="font-mono text-[10px] text-tp-soft">cached full pack</div>
        </div>

        <div className="pt-[88px] font-mono text-[34px] leading-none text-tp-accent">+</div>

        <div className="grid justify-items-center gap-3">
          <div className="font-mono text-[12px] text-tp-accent">diff token</div>
          <svg
            aria-label="Diff token"
            className="h-auto w-full max-w-[180px]"
            role="img"
            viewBox="-7 -7 158 158"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              fill="none"
              height={TOKEN_H + 12}
              rx={4}
              stroke="var(--accent)"
              strokeWidth={2}
              width={TOKEN_W + 12}
              x={-6}
              y={-6}
            />
            <TokenGrid mode="diff" />
          </svg>
          <ul className="grid gap-1 font-mono text-[10px] text-tp-soft">
            {PATCHES.map((patch, index) => (
              <li key={patch.label} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: patch.color }} />
                <span>{patch.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-[88px] font-mono text-[34px] leading-none text-tp-accent">=</div>

        <div className="grid justify-items-center gap-3">
          <div className="font-mono text-[12px] text-tp-fg">result token</div>
          <svg
            aria-label="Result token with diff pixels applied"
            className="h-auto w-full max-w-[180px]"
            role="img"
            viewBox={`0 0 ${TOKEN_W} ${TOKEN_H}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <TokenGrid mode="result" />
            <PatchBorders inset={0.75} strokeWidth={2.6} />
          </svg>
          <div className="font-mono text-[10px] text-tp-soft">baseline pixels + diff pixels</div>
        </div>
      </div>
    </div>
  )
}

export async function DiffTokens() {
  return (
    <section className="border-b border-tp-border">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <article className="grid gap-10">
          <header className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
                § Diff tokens
              </div>
              <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
                Ship changes as tokens, not full packs.
              </h2>
            </div>

            <p className="text-[15px] leading-relaxed text-tp-muted">
              A diff token stores the operations between two Pack states. The client keeps a base
              token, downloads the diff token, and applies it locally to reconstruct the final Pack:
              <span className="text-tp-fg"> base token + diff token → final pack</span>.
            </p>
          </header>

          <div className="min-w-0">
            <DiffTokenFlow />
          </div>

          <aside className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border lg:grid-cols-3">
            {STEPS.map(step => (
              <CodeBlock
                key={step.label}
                className="no-code-scroll h-full rounded-none border-0"
                code={step.code}
                label={step.label}
              />
            ))}
          </aside>
        </article>
      </div>
    </section>
  )
}
