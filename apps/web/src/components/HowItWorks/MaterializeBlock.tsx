import { CodeBlock } from '@/components/CodeBlock/CodeBlock'
import { type FileRegion, PixelToken } from '@/components/Rough/PixelToken'
import { generateRoughPaths } from '@/components/Rough/rough-paths'

const APP_FILES: FileRegion[] = [
  { x: 0, y: 0, width: 0.55, height: 0.3, role: 'file-a', label: 'index.html' },
  { x: 0.55, y: 0, width: 0.45, height: 0.3, role: 'file-b', label: 'app.js' },
  { x: 0, y: 0.3, width: 1, height: 0.35, role: 'file-c', label: 'styles.css' },
  { x: 0, y: 0.65, width: 1, height: 0.35, role: 'file-d', label: 'assets/' },
]

const MATERIALIZE_CODE = `import { decodeRouter } from '@tokenpack/browser'

const r = await decodeRouter('/app.png')

// CSS → <head>, JS → <body>.
// Your DOM is running the app now.
await r.materialize(['app.js', 'styles.css'])`

const PREVIEW_W = 280
const PREVIEW_H = 200

const strokeForRole = (role: string | null): string => {
  if (role === 'accent') return 'var(--accent)'
  if (role === 'muted') return 'var(--soft)'

  return 'var(--fg)'
}

function LiveAppPreview() {
  const paths = generateRoughPaths(b => {
    // Browser window frame
    b.rectangle(8, 8, PREVIEW_W - 16, PREVIEW_H - 16)
    // Tab bar separator
    b.line(8, 36, PREVIEW_W - 8, 36, { strokeWidth: 0.8, role: 'muted' })
    // Inside: a fake app — header bar (accent), two content blocks, a button
    b.rectangle(24, 56, PREVIEW_W - 48, 18, { strokeWidth: 1.2, role: 'accent' })
    b.line(24, 96, PREVIEW_W - 48, 96, { strokeWidth: 0.7, role: 'muted' })
    b.line(24, 112, PREVIEW_W - 70, 112, { strokeWidth: 0.7, role: 'muted' })
    b.line(24, 128, PREVIEW_W - 110, 128, { strokeWidth: 0.7, role: 'muted' })
    // Button
    b.rectangle(24, 152, 70, 22, { strokeWidth: 1, role: 'accent' })
  })

  return (
    <svg
      aria-hidden="true"
      className="block w-full"
      style={{ maxWidth: PREVIEW_W }}
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tab dots */}
      <circle cx={22} cy={22} fill="var(--soft)" opacity={0.5} r={3.5} />
      <circle cx={34} cy={22} fill="var(--soft)" opacity={0.5} r={3.5} />
      <circle cx={46} cy={22} fill="var(--soft)" opacity={0.5} r={3.5} />

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

      {/* Header text */}
      <text className="font-mono" fill="var(--accent-fg)" fontSize={10} x={32} y={68}>
        my app
      </text>
      {/* Button label */}
      <text
        className="font-mono"
        fill="var(--accent)"
        fontSize={10}
        textAnchor="middle"
        x={59}
        y={166}
      >
        live ●
      </text>
    </svg>
  )
}

export async function MaterializeBlock() {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_auto_minmax(0,1.4fr)_auto_minmax(0,0.9fr)] lg:gap-8">
      {/* Input — app token */}
      <div className="flex flex-col items-center gap-3">
        <div className="self-start font-mono text-[10px] tracking-[0.18em] text-tp-soft uppercase">
          app.png · input
        </div>
        <PixelToken files={APP_FILES} seed="materialize-app" size={14} viewSize={220} />
      </div>

      <div className="flex items-center justify-center">
        <span className="font-mono text-[28px] leading-none text-tp-accent">→</span>
      </div>

      <div className="min-w-0">
        <CodeBlock code={MATERIALIZE_CODE} lang="ts" />
      </div>

      <div className="flex items-center justify-center">
        <span className="font-mono text-[28px] leading-none text-tp-accent">→</span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="self-start font-mono text-[10px] tracking-[0.18em] text-tp-soft uppercase">
          your DOM · live
        </div>
        <LiveAppPreview />
      </div>
    </div>
  )
}
