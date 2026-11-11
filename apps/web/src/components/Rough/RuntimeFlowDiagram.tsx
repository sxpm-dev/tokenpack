import { RoughLabel, RoughSvg } from './RoughSvg'

const W = 900
const H = 360

export function RuntimeFlowDiagram() {
  return (
    <RoughSvg
      draw={builder => {
        // Stage boxes — five along a horizontal flow line
        // 1. app code   2. manifest   3. planner   4. HTTP   5. bytes
        builder.rectangle(20, 130, 150, 100)
        builder.rectangle(210, 130, 150, 100)
        builder.rectangle(400, 130, 150, 100, { strokeWidth: 1.4, role: 'accent' })
        builder.rectangle(590, 130, 150, 100)
        builder.rectangle(770, 130, 110, 100)

        // arrows between them
        builder.arrow(175, 180, 205, 180, { strokeWidth: 1.1, roughness: 1.3 })
        builder.arrow(365, 180, 395, 180, { strokeWidth: 1.1, roughness: 1.3 })
        builder.arrow(555, 180, 585, 180, { strokeWidth: 1.1, roughness: 1.3 })
        builder.arrow(745, 180, 765, 180, { strokeWidth: 1.1, roughness: 1.3 })

        // 5 strategy branches sprouting from planner box (downward)
        const planX = 475 // center of planner box
        const planY = 230 // bottom of planner box
        const stratY = 320 // strategy label baseline
        const stratXs = [330, 410, 475, 540, 620]

        stratXs.forEach(x => {
          builder.line(planX, planY, x, stratY - 20, {
            strokeWidth: 0.8,
            roughness: 1.4,
            role: 'muted',
          })
        })

        // tiny "5 patterns" wrap
        builder.rectangle(305, stratY - 18, 340, 38, { strokeWidth: 0.9, role: 'muted' })
      }}
      height={H}
      width={W}
    >
      {/* Top header */}
      <RoughLabel align="center" width={70} x={50} y={11}>
        <div className="text-[10px] tracking-[0.18em] text-tp-soft uppercase">
          runtime · what happens on{' '}
          <span className="font-mono text-tp-fg">router.text(&apos;/app.js&apos;)</span>
        </div>
      </RoughLabel>

      {/* 1. app code */}
      <RoughLabel align="center" width={18} x={10.5} y={45}>
        <div className="handwrite text-[12.5px] text-tp-fg">your app</div>
        <div className="mt-0.5 font-mono text-[10.5px] text-tp-muted">await router.text(</div>
        <div className="font-mono text-[10.5px] text-tp-fg">&apos;/app.js&apos;</div>
        <div className="font-mono text-[10.5px] text-tp-muted">)</div>
      </RoughLabel>

      {/* 2. manifest */}
      <RoughLabel align="center" width={18} x={31.5} y={45}>
        <div className="handwrite text-[12.5px] text-tp-fg">manifest</div>
        <div className="mt-0.5 font-mono text-[10.5px] text-tp-muted">
          lookup &apos;/app.js&apos;
        </div>
        <div className="font-mono text-[10.5px] text-tp-fg">→ segments[]</div>
      </RoughLabel>

      {/* 3. planner */}
      <RoughLabel align="center" width={18} x={52.5} y={45}>
        <div className="handwrite text-[12.5px] text-tp-accent">planner</div>
        <div className="mt-0.5 text-[10.5px] text-tp-fg">picks the cheapest</div>
        <div className="text-[10.5px] text-tp-muted">fetch shape</div>
      </RoughLabel>

      {/* 4. HTTP */}
      <RoughLabel align="center" width={18} x={73.5} y={45}>
        <div className="handwrite text-[12.5px] text-tp-fg">HTTP</div>
        <div className="mt-0.5 font-mono text-[10.5px] text-tp-muted">GET chunk-N.png</div>
        <div className="font-mono text-[10.5px] text-tp-fg">Range: bytes=…</div>
      </RoughLabel>

      {/* 5. bytes */}
      <RoughLabel align="center" width={13} x={91} y={45}>
        <div className="handwrite text-[12.5px] text-tp-fg">bytes</div>
        <div className="mt-0.5 font-mono text-[10.5px] text-tp-muted">→ file</div>
        <div className="font-mono text-[10.5px] text-tp-fg">→ string</div>
      </RoughLabel>

      {/* Strategy branches label */}
      <RoughLabel align="center" width={42} x={52.5} y={89}>
        <div className="flex items-center justify-center gap-3 font-mono text-[10px] text-tp-muted">
          <span>single range</span>
          <span>·</span>
          <span>merged</span>
          <span>·</span>
          <span>parallel</span>
          <span>·</span>
          <span>tiny cluster</span>
          <span>·</span>
          <span>whole chunk</span>
        </div>
      </RoughLabel>
    </RoughSvg>
  )
}
