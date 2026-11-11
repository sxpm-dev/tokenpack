// Plain-language stills for the Pixel-Range page.
// Variant "single":    one image, one byte slice fetched via HTTP Range.
// Variant "parallel":  same image, N slices fetched at once.

interface Slice {
  /** 0-1 top position within the image rect. */
  top: number
  /** 0-1 height within the image rect. */
  height: number
  /** Display label, e.g. "bytes=420-980". */
  label: string
}

const SINGLE_SLICE: Slice = { top: 0.36, height: 0.18, label: 'bytes=420-980' }

const PARALLEL_SLICES: Slice[] = [
  { top: 0.08, height: 0.14, label: 'bytes=0-180' },
  { top: 0.3, height: 0.18, label: 'bytes=181-460' },
  { top: 0.54, height: 0.16, label: 'bytes=461-720' },
  { top: 0.76, height: 0.16, label: 'bytes=721-960' },
]

function ImageWithSlices({ slices }: { slices: Slice[] }) {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-lg border border-tp-border"
      style={{
        aspectRatio: '4 / 3',
        background:
          'linear-gradient(135deg, var(--file-a) 0%, var(--accent) 35%, var(--file-c) 70%, var(--file-b) 100%)',
      }}
    >
      <div className="absolute inset-0 bg-tp-bg/10" />
      {slices.map(slice => (
        <div
          key={slice.label}
          className="absolute right-0 left-0 border-y-2 border-tp-accent bg-tp-bg/60"
          style={{ top: `${slice.top * 100}%`, height: `${slice.height * 100}%` }}
        />
      ))}
    </div>
  )
}

function RequestPanel({ slices }: { slices: Slice[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-tp-border bg-tp-bg">
      <div className="border-b border-tp-border px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
        Requests
      </div>
      <div className="flex flex-col gap-1 p-3 font-mono text-[12px] leading-relaxed text-tp-fg">
        {slices.map(slice => (
          <div key={slice.label}>
            <span className="text-[#ff7b72]">GET</span> cover.png{' '}
            <span className="text-[#79c0ff]">Range</span>: {slice.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function ResponsePanel({ slices, parallel }: { slices: Slice[]; parallel: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">Response</div>
      <div className="flex flex-col gap-1.5">
        {slices.map(slice => (
          <div
            key={slice.label}
            className="rounded-md border border-tp-accent/60 bg-tp-elev px-3 py-2 font-mono text-[11.5px] text-tp-fg"
          >
            {slice.label.replace('bytes=', '').replace('-', '–')} ·{' '}
            <span className="text-tp-soft">bytes</span>
          </div>
        ))}
      </div>
      {parallel && (
        <p className="font-mono text-[10.5px] text-tp-soft">
          ↑ all slices arrive in parallel from the same image
        </p>
      )}
    </div>
  )
}

function Arrow() {
  return (
    <div className="hidden items-center justify-center text-tp-accent lg:flex">
      <span className="font-mono text-[36px] leading-none">→</span>
    </div>
  )
}

interface RangeFetchStillProps {
  variant: 'single' | 'parallel'
  caption?: React.ReactNode
}

export function RangeFetchStill({ variant, caption }: RangeFetchStillProps) {
  const slices = variant === 'parallel' ? PARALLEL_SLICES : [SINGLE_SLICE]

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1.4fr)_auto_minmax(0,1fr)]">
        <ImageWithSlices slices={slices} />
        <Arrow />
        <RequestPanel slices={slices} />
        <Arrow />
        <ResponsePanel parallel={variant === 'parallel'} slices={slices} />
      </div>
      {caption && <p className="text-center font-mono text-[11px] text-tp-soft">{caption}</p>}
    </div>
  )
}
