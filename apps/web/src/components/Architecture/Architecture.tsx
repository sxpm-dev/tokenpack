const ENCODE = `┌─────────────────────────────────────────────────────────────────┐
│  encode(files)  →  image                                        │
│                                                                 │
│    ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────────┐  │
│    │  files  │ → │ archive  │ → │ compress │ → │ draw pixels │  │
│    │ N paths │   │ manifest │   │ brotli   │   │ Image Token │  │
│    │ + bytes │   │ + bytes  │   │ /deflate │   │  / AVIF     │  │
│    └─────────┘   └──────────┘   └──────────┘   └─────────────┘  │
│                                                                 │
│  decode(image)  →  files                                        │
│                                                                 │
│    ┌────────┐    ┌──────────┐    ┌──────────┐   ┌────────────┐  │
│    │  read  │ →  │decompress│ →  │unarchive │ → │  files     │  │
│    │ pixels │    │   stream │    │ manifest │   │ random     │  │
│    │ tpAK   │    │  zlib/br │    │   pack   │   │ access     │  │
│    └────────┘    └──────────┘    └──────────┘   └────────────┘  │
│                       ▲                                         │
│                       │  bytes still arriving — first useful    │
│                       │  byte to your app: ~2.7 ms              │
└─────────────────────────────────────────────────────────────────┘`

const ROUTER = `router.png  ◀── tiny manifest (JSON)
   │
   │  files: [
   │    { path: "app.js",     bytes: 12345,
   │      segments: [{ chunkId: 0, offset: 0, len: 12345 }] },
   │    { path: "styles.css", bytes:  2048,
   │      segments: [{ chunkId: 1, offset: 0, len:  2048 }] },
   │    { path: "vendor.js",  bytes: 4_500_000,
   │      segments: [
   │        { chunkId: 2, offset: 0,        len: 1_048_576 },
   │        { chunkId: 3, offset: 1048576,  len: 1_048_576 },
   │        ... ] },
   │  ]
   ▼
chunk-0.png  ◀── HTTP Range: bytes=0-12344     ─▶  app.js
chunk-1.png  ◀── HTTP Range: bytes=0-2047      ─▶  styles.css
chunk-2.png  ◀── HTTP Range: bytes=0-1048575   ─▶  vendor.js [pt 1]
chunk-3.png  ◀── HTTP Range: bytes=0-1048575   ─▶  vendor.js [pt 2]
... others    ◀── unused for this request      ─▶  skipped`

export function Architecture() {
  return (
    <section className="relative border-b border-tp-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <header className="mb-12 flex items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § Architecture
            </div>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
              Two flows. <span className="italic-display text-tp-muted">Shared primitives.</span>
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-tp-muted">
              The end-to-end token does compression + carrier in one pass. The router pattern splits
              the bundle so consumers can pull only the bytes they need over HTTP Range.
            </p>
          </div>
        </header>

        <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border xl:grid-cols-2">
          <Diagram
            caption="Bytes → archive → brotli/deflate → pixels. On the way back, the decoder pulls bytes from the image as they arrive — the inner stream starts inflating before the network finishes."
            label="Pipeline · single token"
            tag="encode → decode"
          >
            {ENCODE}
          </Diagram>
          <Diagram
            caption="The manifest is a JSON index. Chunk PNGs are decorated containers; pack data lives in the tpAK ancillary chunk. Consumers Range-fetch only the bytes they need."
            label="Pipeline · router token"
            tag="manifest + chunks"
          >
            {ROUTER}
          </Diagram>
        </div>
      </div>
    </section>
  )
}

interface DiagramProps {
  label: string
  tag: string
  caption: string
  children: string
}

function Diagram({ label, tag, caption, children }: DiagramProps) {
  return (
    <article className="flex flex-col gap-4 bg-tp-bg p-6">
      <header className="flex items-center justify-between gap-3 border-b border-tp-border pb-3">
        <span className="text-[11px] tracking-[0.18em] text-tp-muted uppercase">{label}</span>
        <span className="font-mono text-[10px] tracking-[0.1em] text-tp-soft uppercase">{tag}</span>
      </header>
      <pre className="ascii overflow-x-auto rounded-md border border-tp-border bg-tp-elev p-4 text-tp-fg/90">
        {children}
      </pre>
      <p className="text-[13.5px] leading-relaxed text-tp-muted">{caption}</p>
    </article>
  )
}
