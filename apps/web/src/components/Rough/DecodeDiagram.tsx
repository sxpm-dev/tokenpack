import { type FileRegion, PixelToken } from './PixelToken'

const DECODE_FILES: FileRegion[] = [
  { x: 0, y: 0, width: 0.55, height: 0.3, role: 'file-a', label: 'readme.md' },
  { x: 0.55, y: 0, width: 0.45, height: 0.3, role: 'file-b', label: 'main.ts' },
  { x: 0, y: 0.3, width: 1, height: 0.4, role: 'file-c', label: 'src/app.ts' },
  { x: 0, y: 0.7, width: 1, height: 0.3, role: 'file-d', label: 'src/util.ts' },
]

export function DecodeDiagram() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      {/* PNG in */}
      <PixelToken
        caption="token.png"
        files={DECODE_FILES}
        seed="decode-token"
        size={14}
        tag="input"
        viewSize={220}
      />

      <span className="font-mono text-[40px] leading-none text-tp-accent">→</span>

      {/* Files out */}
      <div className="flex flex-col gap-2 font-mono text-[12.5px]">
        <div className="text-[10px] tracking-[0.18em] text-tp-soft uppercase">pack.list</div>
        <ul className="flex flex-col gap-1.5">
          {DECODE_FILES.map(f => (
            <li key={f.label} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: `var(--${f.role})` }}
              />
              <span className="text-tp-fg">{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
