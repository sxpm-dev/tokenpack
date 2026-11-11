import { CodeBlock } from '@/components/CodeBlock/CodeBlock'
import { type FileRegion, PixelToken } from '@/components/Rough/PixelToken'

const DECODE_FILES: FileRegion[] = [
  { x: 0, y: 0, width: 0.55, height: 0.3, role: 'file-a', label: 'readme.md' },
  { x: 0.55, y: 0, width: 0.45, height: 0.3, role: 'file-b', label: 'main.ts' },
  { x: 0, y: 0.3, width: 1, height: 0.4, role: 'file-c', label: 'src/app.ts' },
  { x: 0, y: 0.7, width: 1, height: 0.3, role: 'file-d', label: 'src/util.ts' },
]

const DECODE_CODE = `import { decode } from '@tokenpack/node'

const pack = await decode('./token.png')

const files = await pack.list()
const readme = await pack.text('readme.md')`

export async function DecodeBlock() {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_auto_minmax(0,1.4fr)_auto_minmax(0,0.9fr)] lg:gap-8">
      {/* Input — token PNG */}
      <div className="flex flex-col items-center gap-3">
        <div className="self-start font-mono text-[10px] tracking-[0.18em] text-tp-soft uppercase">
          token.png · input
        </div>
        <PixelToken files={DECODE_FILES} seed="decode-token" size={14} viewSize={220} />
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center">
        <span className="font-mono text-[28px] leading-none text-tp-accent">→</span>
      </div>

      {/* Code */}
      <div className="min-w-0">
        <CodeBlock code={DECODE_CODE} lang="ts" />
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center">
        <span className="font-mono text-[28px] leading-none text-tp-accent">→</span>
      </div>

      {/* Output — pack.list */}
      <div className="flex flex-col gap-3">
        <div className="font-mono text-[10px] tracking-[0.18em] text-tp-soft uppercase">
          pack.list · output
        </div>
        <ul className="flex flex-col gap-1.5 font-mono text-[13px]">
          {DECODE_FILES.map(f => (
            <li key={f.label} className="flex items-center gap-2 text-tp-fg">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: `var(--${f.role})` }}
              />
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
