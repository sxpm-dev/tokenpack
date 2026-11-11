import { type FileRegion, PixelToken } from './PixelToken'

// A consistent "chunk-0" token shared across the first four patterns.
// Six files arranged like a real packed chunk: a few big ones, several tiny.
const CHUNK_0_FILES: FileRegion[] = [
  { x: 0, y: 0, width: 0.55, height: 0.22, role: 'file-a', label: 'app.js' },
  { x: 0.55, y: 0, width: 0.45, height: 0.22, role: 'file-b', label: 'styles.css' },
  { x: 0, y: 0.22, width: 1, height: 0.28, role: 'file-c', label: 'vendor/react.js' },
  { x: 0, y: 0.5, width: 0.5, height: 0.2, role: 'file-d', label: 'header.js' },
  { x: 0.5, y: 0.5, width: 0.5, height: 0.2, role: 'file-e', label: 'footer.js' },
  { x: 0, y: 0.7, width: 1, height: 0.3, role: 'file-f', label: 'tiny files ×8' },
]

// Tiny-file cluster: many small slots (one row per "file"), all in one chunk.
const TINY_FILES: FileRegion[] = Array.from({ length: 12 }, (_, i) => {
  const cols = 4
  const col = i % cols
  const row = Math.floor(i / cols)

  return {
    x: col / cols + 0.005,
    y: row / 3 + 0.005,
    width: 1 / cols - 0.01,
    height: 1 / 3 - 0.01,
    role: (['file-a', 'file-b', 'file-c', 'file-d', 'file-e', 'file-f'] as const)[i % 6],
  }
})

// Big-file split: each segment is the full chunk.
const BIG_FILE_SEGMENT: FileRegion[] = [{ x: 0, y: 0, width: 1, height: 1, role: 'file-c' }]

interface PatternProps {
  n: string
  title: string
  desc: string
  http: string
  children: React.ReactNode
}

function Pattern({ n, title, desc, http, children }: PatternProps) {
  return (
    <article className="grid gap-6 bg-tp-bg p-6 lg:grid-cols-[1fr_1.3fr] lg:gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[11px] text-tp-soft">{n}</span>
          <h3 className="text-[15.5px] font-medium tracking-tight">{title}</h3>
        </div>
        <p className="text-[12.5px] leading-relaxed text-tp-muted">{desc}</p>
        <code className="mt-1 inline-block w-fit rounded border border-tp-border bg-tp-elev px-2 py-1 font-mono text-[11px] text-tp-fg">
          {http}
        </code>
      </header>
      <div className="flex items-center justify-center">{children}</div>
    </article>
  )
}

export function RangeStrategiesDiagram() {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border">
      {/* 01 — Single file from one chunk */}
      <Pattern
        desc="One file lives entirely inside one chunk. The decoder issues a single HTTP Range request for just that file's slice — the rest of the chunk never touches the wire."
        http="GET chunk-0.png   Range: bytes=B-C"
        n="01"
        title="Single byte range"
      >
        <PixelToken
          caption="chunk-0.png"
          fetched={[1]}
          files={CHUNK_0_FILES}
          seed="rsd-01"
          tag="fetched: styles.css"
        />
      </Pattern>

      {/* 02 — Multiple files from same chunk, multi-range header */}
      <Pattern
        desc="Multiple files in the same chunk, fetched in one HTTP request with a multi-range header. One round-trip pulls several files' bytes at once."
        http="GET chunk-0.png   Range: bytes=B-C, D-E, F-G"
        n="02"
        title="Merged byte ranges"
      >
        <PixelToken
          caption="chunk-0.png"
          fetched={[0, 3, 4]}
          files={CHUNK_0_FILES}
          seed="rsd-02"
          tag="3 ranges · 1 request"
        />
      </Pattern>

      {/* 03 — Big file split across chunks, parallel fetch */}
      <Pattern
        desc="A large file is split across several chunks. The decoder fans out N parallel range requests; each pulls one segment. Reassembly uses the manifest's fileOffset hints."
        http="GET chunk-0..3.png   Range: bytes=0-1M   ×4 in parallel"
        n="03"
        title="Parallel segments"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(['rsd-03-a', 'rsd-03-b', 'rsd-03-c', 'rsd-03-d'] as const).map((s, i) => (
            <PixelToken
              key={s}
              caption={`chunk-${i}.png`}
              files={BIG_FILE_SEGMENT}
              seed={s}
              tag={`seg ${i}/3`}
              viewSize={140}
            />
          ))}
        </div>
      </Pattern>

      {/* 04 — Tiny files clustered in one chunk, whole-chunk fetch */}
      <Pattern
        desc="Many tiny files (< 32 KB) are packed contiguously into a single shared chunk during encode. One whole-chunk fetch pulls dozens of files in a single HTTP request."
        http="GET chunk-tiny-0.png   (no Range — fetch the whole chunk)"
        n="04"
        title="Tiny files clustered"
      >
        <PixelToken
          caption="chunk-tiny-0.png"
          files={TINY_FILES}
          seed="rsd-04"
          tag="12 files · 1 fetch"
        />
      </Pattern>

      {/* 05 — Whole-chunk fetch */}
      <Pattern
        desc="When most of a chunk will be requested anyway, the planner skips Range entirely and grabs the whole chunk. The browser caches it; subsequent fetches hit cache."
        http="GET chunk-2.png   (whole chunk · cache-hit next time)"
        n="05"
        title="Whole chunk"
      >
        <PixelToken
          caption="chunk-2.png"
          files={[
            { x: 0, y: 0, width: 1, height: 1, role: 'file-a', label: 'app.js (main bundle)' },
          ]}
          seed="rsd-05"
          tag="cached"
        />
      </Pattern>
    </div>
  )
}
