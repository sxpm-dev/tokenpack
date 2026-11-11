export type FileRole = 'file-a' | 'file-b' | 'file-c' | 'file-d' | 'file-e' | 'file-f'

export interface FileRegion {
  /** Normalized 0–1 coords inside the grid. */
  x: number
  y: number
  width: number
  height: number
  role: FileRole
  label?: string
}

interface PixelTokenProps {
  /** Square grid shorthand. Default 16. Ignored if `width`/`height` set. */
  size?: number
  /** Explicit grid width in pixel-units (overrides `size`). */
  width?: number
  /** Explicit grid height in pixel-units (overrides `size`). */
  height?: number
  /** Deterministic palette seed. */
  seed?: string
  files?: FileRegion[]
  /** Indices into `files` that are highlighted; everything else dims. */
  fetched?: number[]
  /** Visual width in CSS px. Height scales to keep the grid aspect ratio. */
  viewSize?: number
  className?: string
  /** Caption rendered above the grid (used by docs/range-strategy diagrams). */
  caption?: string
  /** Bottom-right tag in the caption row. */
  tag?: string
}

const ROLE_VARS: Record<FileRole, string> = {
  'file-a': 'var(--file-a)',
  'file-b': 'var(--file-b)',
  'file-c': 'var(--file-c)',
  'file-d': 'var(--file-d)',
  'file-e': 'var(--file-e)',
  'file-f': 'var(--file-f)',
}

// Tiny seeded PRNG (mulberry32) so the pixel pattern is identical across renders.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0

  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s

    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(s: string): number {
  let h = 0

  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }

  return h
}

interface PixelCell {
  x: number
  y: number
  color: string
}

function buildPixels(w: number, h: number, seed: string): PixelCell[] {
  const rng = mulberry32(hashSeed(seed))
  const out: PixelCell[] = []

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const hue = Math.floor(rng() * 360)
      const sat = 22 + Math.floor(rng() * 28)
      const lit = 38 + Math.floor(rng() * 30)

      out.push({ x, y, color: `hsl(${hue} ${sat}% ${lit}%)` })
    }
  }

  return out
}

export function PixelToken({
  size = 16,
  width,
  height,
  seed = 'tokenpack',
  files = [],
  fetched,
  viewSize = 320,
  className,
  caption,
  tag,
}: PixelTokenProps) {
  const w = width ?? size
  const h = height ?? size
  const pixels = buildPixels(w, h, seed)
  const showAllFetched = fetched === undefined
  const fetchedSet = new Set(fetched ?? [])
  const hasFetchedFiles = !showAllFetched && fetchedSet.size > 0

  const maskId = `pixmask-${seed}-${(fetched ?? []).join('-')}`
  const tintOpacity = 0.55

  // Preserve the grid's aspect ratio at render time.
  const aspect = `${w} / ${h}`

  return (
    <figure className={`flex flex-col items-center gap-2 ${className ?? ''}`}>
      {caption && (
        <figcaption
          className="flex w-full items-center justify-between text-[10px] tracking-[0.18em] text-tp-soft uppercase"
          style={{ maxWidth: viewSize }}
        >
          <span>{caption}</span>
          {tag && <span className="font-mono">{tag}</span>}
        </figcaption>
      )}
      <svg
        aria-hidden="true"
        className="block h-auto"
        style={{ width: viewSize, aspectRatio: aspect }}
        viewBox={`0 0 ${w} ${h}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 1. Pixel grid */}
        <g>
          {pixels.map(p => (
            <rect key={`${p.x}-${p.y}`} fill={p.color} height={1} width={1} x={p.x} y={p.y} />
          ))}
        </g>

        {/* 2. File-region tints — colored overlays in lieu of rough outlines.
             Each file gets a soft fill in its role color so the eye can pick
             out where it lives without a scribbled border. */}
        <g style={{ mixBlendMode: 'overlay' }}>
          {files.map((file, idx) => {
            const isFetched = showAllFetched || fetchedSet.has(idx)

            if (!isFetched) return null

            return (
              <rect
                key={`tint-${idx}`}
                fill={ROLE_VARS[file.role]}
                height={file.height * h}
                opacity={tintOpacity}
                width={file.width * w}
                x={file.x * w}
                y={file.y * h}
              />
            )
          })}
        </g>

        {/* 3. Dim non-fetched areas when a fetched filter is set */}
        {hasFetchedFiles && (
          <>
            <defs>
              <mask id={maskId}>
                <rect fill="white" height={h} width={w} x={0} y={0} />
                {files.map((file, idx) =>
                  fetchedSet.has(idx) ? (
                    <rect
                      key={`mask-${idx}`}
                      fill="black"
                      height={file.height * h}
                      width={file.width * w}
                      x={file.x * w}
                      y={file.y * h}
                    />
                  ) : null,
                )}
              </mask>
            </defs>
            <rect
              fill="var(--bg)"
              height={h}
              mask={`url(#${maskId})`}
              opacity={0.88}
              width={w}
              x={0}
              y={0}
            />
          </>
        )}
      </svg>

      {/* Legend — only renders when files carry labels */}
      {files.some(f => f.label) && (
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px]">
          {files.map((file, idx) => {
            const isFetched = showAllFetched || fetchedSet.has(idx)

            return file.label ? (
              <li
                key={idx}
                className={`flex items-center gap-1.5 font-mono ${
                  isFetched ? 'text-tp-fg' : 'text-tp-soft'
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: ROLE_VARS[file.role] }}
                />
                {file.label}
              </li>
            ) : null
          })}
        </ul>
      )}
    </figure>
  )
}
