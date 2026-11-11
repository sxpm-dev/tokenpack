import { RoughLabel, RoughSvg } from './RoughSvg'

export function SkillDistributionDiagram() {
  return (
    <RoughSvg
      draw={builder => {
        // folder (input)
        builder.rectangle(20, 60, 110, 110)
        builder.line(20, 80, 130, 80, { strokeWidth: 0.8, role: 'muted' })
        builder.line(38, 60, 60, 60, { strokeWidth: 0.8, role: 'muted' })

        // arrow → encode
        builder.arrow(135, 115, 175, 115, { roughness: 1.2 })

        // PNG (output)
        builder.rectangle(180, 60, 110, 110, { strokeWidth: 1.4, role: 'accent' })

        // arrow → URL
        builder.arrow(295, 115, 335, 115, { roughness: 1.2 })

        // URL pill
        builder.rectangle(340, 95, 130, 40, { strokeWidth: 1 })
      }}
      height={210}
      width={500}
    >
      <RoughLabel align="center" width={22} x={15} y={12}>
        <div className="handwrite text-[11px] text-tp-fg">skill folder</div>
      </RoughLabel>
      <RoughLabel align="center" width={20} x={47} y={12}>
        <div className="handwrite text-[11px] text-tp-accent">router.png</div>
      </RoughLabel>
      <RoughLabel align="center" width={28} x={81} y={12}>
        <div className="handwrite text-[10.5px] text-tp-fg">one URL</div>
      </RoughLabel>

      <div
        className="absolute font-mono text-[10px] text-tp-muted"
        style={{ left: '47%', top: '55%', transform: 'translate(-50%, 0)' }}
      >
        manifest + chunks
      </div>

      <div
        className="absolute font-mono text-[9px] text-tp-muted"
        style={{ left: '81%', top: '70%', transform: 'translate(-50%, 0)' }}
      >
        npx tokenpack install
      </div>
    </RoughSvg>
  )
}
