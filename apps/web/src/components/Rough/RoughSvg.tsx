import type { ReactNode } from 'react'

import { generateRoughPaths, type RoughBuilder, type RoughPath } from './rough-paths'

interface RoughSvgProps {
  /** SVG viewBox dimensions; the SVG scales responsively. */
  width: number
  height: number
  draw: (builder: RoughBuilder) => void
  className?: string
  /** Foreground/overlay text labels rendered atop the rough shapes. */
  children?: ReactNode
}

const ROLE_STROKE: Record<string, string> = {
  accent: 'var(--accent)',
  muted: 'var(--soft)',
  fg: 'var(--fg)',
  'file-a': 'var(--file-a)',
  'file-b': 'var(--file-b)',
  'file-c': 'var(--file-c)',
  'file-d': 'var(--file-d)',
  'file-e': 'var(--file-e)',
  'file-f': 'var(--file-f)',
}

function strokeFor(role: string | null): string {
  if (role && ROLE_STROKE[role]) return ROLE_STROKE[role]!

  return 'var(--fg)'
}

export function RoughSvg({ width, height, draw, className, children }: RoughSvgProps) {
  const paths = generateRoughPaths(draw)

  return (
    <div className={`relative w-full ${className ?? ''}`}>
      <svg
        aria-hidden="true"
        className="h-auto w-full"
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          {paths.map((path, idx) => (
            <RoughPathNode key={idx} path={path} />
          ))}
        </g>
      </svg>
      {children && (
        <div
          className="absolute inset-0"
          style={
            {
              // Match labels to the viewBox coordinate space:
              // children position themselves with percentages of width/height.
            }
          }
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface RoughPathNodeProps {
  path: RoughPath
}

function RoughPathNode({ path }: RoughPathNodeProps) {
  const color = strokeFor(path.role)

  if (path.kind === 'fill-solid') {
    return <path d={path.d} fill={color} stroke="none" />
  }

  return (
    <path
      d={path.d}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={path.strokeWidth}
    />
  )
}

/**
 * Absolute-positioned label container inside a RoughSvg, taking percentage
 * positions relative to the SVG viewBox.
 */
interface RoughLabelProps {
  x: number
  y: number
  width?: number
  align?: 'left' | 'center' | 'right'
  children: ReactNode
  className?: string
}

export function RoughLabel({
  x,
  y,
  width = 30,
  align = 'center',
  children,
  className,
}: RoughLabelProps) {
  const transform =
    align === 'center'
      ? 'translate(-50%, -50%)'
      : align === 'right'
        ? 'translate(-100%, -50%)'
        : 'translate(0, -50%)'

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        transform,
        textAlign: align,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  )
}
