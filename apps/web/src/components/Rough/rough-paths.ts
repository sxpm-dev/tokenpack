import type { Drawable, OpSet, Options } from 'roughjs/bin/core'
import type { RoughGenerator } from 'roughjs/bin/generator'
import rough from 'roughjs/bin/rough'

export interface RoughPath {
  d: string
  kind: 'outline' | 'fill-sketch' | 'fill-solid'
  strokeWidth: number
  fillStyle?: string
  /** Optional caller-supplied semantic role ('accent', 'muted', …) for theming. */
  role: string | null
}

interface DrawablePiece {
  drawable: Drawable
  role: string | null
}

export interface RoughBuilder {
  rectangle: (
    x: number,
    y: number,
    w: number,
    h: number,
    options?: Options & { role?: string },
  ) => void
  line: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: Options & { role?: string },
  ) => void
  ellipse: (
    cx: number,
    cy: number,
    w: number,
    h: number,
    options?: Options & { role?: string },
  ) => void
  arrow: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: Options & { role?: string },
  ) => void
  path: (svgPath: string, options?: Options & { role?: string }) => void
  curve: (points: [number, number][], options?: Options & { role?: string }) => void
}

const DEFAULT_OPTIONS: Options = {
  seed: 1,
  roughness: 1.2,
  bowing: 0.8,
  strokeWidth: 1.1,
  fillStyle: 'hachure',
  fillWeight: 0.6,
  hachureGap: 12,
}

export function generateRoughPaths(drawFn: (builder: RoughBuilder) => void): RoughPath[] {
  const gen = rough.generator() as RoughGenerator
  const pieces: DrawablePiece[] = []
  const builder: RoughBuilder = {
    rectangle(x, y, w, h, opts = {}) {
      const { role, ...rest } = opts

      pieces.push({
        drawable: gen.rectangle(x, y, w, h, { ...DEFAULT_OPTIONS, ...rest }),
        role: role ?? null,
      })
    },
    line(x1, y1, x2, y2, opts = {}) {
      const { role, ...rest } = opts

      pieces.push({
        drawable: gen.line(x1, y1, x2, y2, { ...DEFAULT_OPTIONS, ...rest }),
        role: role ?? null,
      })
    },
    ellipse(cx, cy, w, h, opts = {}) {
      const { role, ...rest } = opts

      pieces.push({
        drawable: gen.ellipse(cx, cy, w, h, { ...DEFAULT_OPTIONS, ...rest }),
        role: role ?? null,
      })
    },
    arrow(x1, y1, x2, y2, opts = {}) {
      const { role, ...rest } = opts
      const merged = { ...DEFAULT_OPTIONS, ...rest }

      pieces.push({ drawable: gen.line(x1, y1, x2, y2, merged), role: role ?? null })
      // Arrowhead — two short strokes back from the tip.
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const len = 10
      const ax = x2 - len * Math.cos(angle - Math.PI / 6)
      const ay = y2 - len * Math.sin(angle - Math.PI / 6)
      const bx = x2 - len * Math.cos(angle + Math.PI / 6)
      const by = y2 - len * Math.sin(angle + Math.PI / 6)

      pieces.push({ drawable: gen.line(x2, y2, ax, ay, merged), role: role ?? null })
      pieces.push({ drawable: gen.line(x2, y2, bx, by, merged), role: role ?? null })
    },
    path(svgPath, opts = {}) {
      const { role, ...rest } = opts

      pieces.push({
        drawable: gen.path(svgPath, { ...DEFAULT_OPTIONS, ...rest }),
        role: role ?? null,
      })
    },
    curve(points, opts = {}) {
      const { role, ...rest } = opts

      pieces.push({
        drawable: gen.curve(points, { ...DEFAULT_OPTIONS, ...rest }),
        role: role ?? null,
      })
    },
  }

  drawFn(builder)

  const out: RoughPath[] = []

  for (const piece of pieces) {
    for (const set of piece.drawable.sets as OpSet[]) {
      const d = gen.opsToPath(set, 2)
      const baseWidth = piece.drawable.options.strokeWidth ?? 1
      const fillWeight = piece.drawable.options.fillWeight ?? baseWidth
      let kind: RoughPath['kind']
      let strokeWidth = baseWidth

      if (set.type === 'path') kind = 'outline'
      else if (set.type === 'fillPath') {
        kind = 'fill-solid'
        strokeWidth = 0
      } else {
        kind = 'fill-sketch'
        strokeWidth = Math.max(0.5, fillWeight)
      }
      out.push({
        d,
        kind,
        strokeWidth,
        role: piece.role,
      })
    }
  }

  return out
}
