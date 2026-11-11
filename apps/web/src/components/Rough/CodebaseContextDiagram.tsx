import { RoughLabel, RoughSvg } from './RoughSvg'

export function CodebaseContextDiagram() {
  return (
    <RoughSvg
      draw={builder => {
        // app.png (the shared artifact)
        builder.rectangle(20, 60, 130, 130, { strokeWidth: 1.4, role: 'accent' })
        // a few "file tree" lines inside
        builder.line(35, 90, 135, 90, { strokeWidth: 0.7, role: 'muted' })
        builder.line(45, 110, 135, 110, { strokeWidth: 0.7, role: 'muted' })
        builder.line(45, 125, 135, 125, { strokeWidth: 0.7, role: 'muted' })
        builder.line(35, 145, 135, 145, { strokeWidth: 0.7, role: 'muted' })
        builder.line(45, 165, 135, 165, { strokeWidth: 0.7, role: 'muted' })

        // arrow to "agent reads one file"
        builder.arrow(155, 125, 215, 125, { roughness: 1.2 })

        // agent box (right)
        builder.rectangle(220, 75, 140, 100)
        // agent loads only one file — highlighted line
        builder.rectangle(230, 110, 120, 18, {
          strokeWidth: 1.2,
          fill: 'currentColor',
          fillWeight: 0.5,
          hachureGap: 6,
          role: 'accent',
        })
      }}
      height={210}
      width={400}
    >
      <RoughLabel align="center" width={26} x={20.5} y={10}>
        <div className="handwrite text-[11px] text-tp-accent">app.png</div>
        <div className="text-[9.5px] text-tp-soft">file tree as manifest</div>
      </RoughLabel>

      <RoughLabel align="center" width={32} x={72.5} y={10}>
        <div className="handwrite text-[11px] text-tp-fg">agent</div>
        <div className="text-[9.5px] text-tp-soft">reads only what it needs</div>
      </RoughLabel>

      <div
        className="absolute font-mono text-[9px] text-tp-muted"
        style={{ left: '72.5%', top: '53%', transform: 'translate(-50%, 0)' }}
      >
        ~ 30 KB · one Range
      </div>
    </RoughSvg>
  )
}
