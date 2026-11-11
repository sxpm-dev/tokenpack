import { RoughLabel, RoughSvg } from './RoughSvg'

const W = 860
const H = 320

export function DiffDiagram() {
  return (
    <RoughSvg
      draw={builder => {
        // v1 base — stroke only
        builder.rectangle(40, 50, 200, 230)
        builder.line(60, 100, 220, 100, { strokeWidth: 0.7, role: 'muted' })
        builder.line(60, 140, 220, 140, { strokeWidth: 0.7, role: 'muted' })
        builder.line(60, 180, 220, 180, { strokeWidth: 0.7, role: 'muted' })
        builder.line(60, 220, 220, 220, { strokeWidth: 0.7, role: 'muted' })

        // diff — accent outline, no fill
        builder.rectangle(330, 80, 200, 170, { strokeWidth: 1.4, role: 'accent' })

        // v2 — stroke only
        builder.rectangle(620, 50, 200, 230)
        builder.line(640, 100, 800, 100, { strokeWidth: 0.7, role: 'muted' })
        builder.line(640, 140, 800, 140, { strokeWidth: 0.7, role: 'muted' })
        builder.line(640, 180, 800, 180, { strokeWidth: 0.7, role: 'muted' })

        // arrows
        builder.arrow(245, 165, 325, 165, { roughness: 1.3 })
        builder.arrow(535, 165, 615, 165, { roughness: 1.3 })

        // + symbol
        builder.line(280, 150, 280, 180, { strokeWidth: 1 })
        builder.line(265, 165, 295, 165, { strokeWidth: 1 })

        // = symbol
        builder.line(560, 157, 590, 157, { strokeWidth: 1 })
        builder.line(560, 173, 590, 173, { strokeWidth: 1 })
      }}
      height={H}
      width={W}
    >
      <RoughLabel align="center" width={18} x={16.5} y={8}>
        <div className="handwrite text-[11.5px] text-tp-fg">v1 pack</div>
        <div className="text-[10px] tracking-[0.14em] text-tp-soft uppercase">base</div>
      </RoughLabel>
      <div className="absolute" style={{ left: '7%', top: '24%', width: '20%' }}>
        <ul className="space-y-2 font-mono text-[11.5px] text-tp-muted">
          <li>a.js</li>
          <li>b.js</li>
          <li>readme</li>
          <li>logo.svg</li>
        </ul>
      </div>

      <RoughLabel align="center" width={20} x={50} y={18}>
        <div className="handwrite text-[11.5px] text-tp-accent">diff</div>
        <div className="text-[10px] tracking-[0.14em] text-tp-soft uppercase">tiny token</div>
      </RoughLabel>
      <div className="absolute" style={{ left: '41%', top: '32%', width: '20%' }}>
        <ul className="space-y-2 font-mono text-[11.5px] text-tp-fg">
          <li>+ c.js</li>
          <li>~ a.js</li>
          <li>- b.js</li>
        </ul>
      </div>

      <RoughLabel align="center" width={18} x={83.5} y={8}>
        <div className="handwrite text-[11.5px] text-tp-fg">v2 pack</div>
        <div className="text-[10px] tracking-[0.14em] text-tp-soft uppercase">reconstructed</div>
      </RoughLabel>
      <div className="absolute" style={{ left: '74%', top: '24%', width: '20%' }}>
        <ul className="space-y-2 font-mono text-[11.5px] text-tp-muted">
          <li>
            a.js <span className="text-tp-accent">*</span>
          </li>
          <li>
            c.js <span className="text-tp-accent">*</span>
          </li>
          <li>readme</li>
        </ul>
      </div>

      <RoughLabel align="center" width={14} x={32.5} y={85}>
        <div className="handwrite text-[11px] text-tp-muted">apply</div>
      </RoughLabel>
    </RoughSvg>
  )
}
