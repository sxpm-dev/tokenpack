const ROWS = [
  { format: 'zip', wire: 176054, encode: '18.8 ms', decode: '4.6 ms', note: 'no streaming' },
  { format: 'tar.gz', wire: 175918, encode: '14.0 ms', decode: '1.5 ms', note: 'no streaming' },
  {
    format: 'brotli-11 (raw)',
    wire: 134073,
    encode: '1135.3 ms',
    decode: '1.6 ms',
    note: 'HTTP only',
  },
  {
    format: 'brotli-6 (raw)',
    wire: 155526,
    encode: '12.8 ms',
    decode: '1.5 ms',
    note: 'HTTP only',
  },
  {
    format: 'TokenPack max-png3',
    wire: 134447,
    encode: '—',
    decode: '8.4 ms',
    note: 'parity with brotli-11',
    accent: true,
  },
  {
    format: 'TokenPack stream-png3',
    wire: 158099,
    encode: '—',
    decode: '10.9 ms · first byte 2.7 ms',
    note: 'streaming win',
    accent: true,
  },
]

const MAX = Math.max(...ROWS.map(r => r.wire))

function fmt(bytes: number): string {
  return bytes.toLocaleString('en-US')
}

export function Benchmark() {
  return (
    <section className="border-b border-tp-border bg-tp-elev2">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <header className="mb-12 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § Benchmark
            </div>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
              <span className="italic-display text-tp-muted">Time-to-first-useful-byte,</span>
              <br />
              not just wire size.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-tp-muted">
              Encoding <code className="font-mono text-tp-fg">react-dom-client.development.js</code>{' '}
              (~1 MB). Wire size lands within a few percent of brotli-11. The win is decode overlap
              — your app sees the first useful byte before the network finishes.
            </p>
          </div>
          <aside className="grid grid-cols-2 gap-px overflow-hidden self-end rounded-md border border-tp-border bg-tp-border">
            <Headline detail="of brotli-11 ratio" label="parity" value="99.7%" />
            <Headline detail="for stream-png3" label="first byte" value="2.7 ms" />
          </aside>
        </header>

        <div className="overflow-hidden rounded-lg border border-tp-border bg-tp-bg">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-tp-border text-[10px] tracking-[0.12em] text-tp-muted uppercase">
                <th className="w-[26%] px-5 py-3 text-left font-medium">Format</th>
                <th className="w-[36%] px-5 py-3 text-left font-medium">Wire bytes</th>
                <th className="px-5 py-3 text-right font-medium">Encode</th>
                <th className="px-5 py-3 text-right font-medium">Decode</th>
                <th className="px-5 py-3 text-left font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {ROWS.map(row => {
                const pct = (row.wire / MAX) * 100

                return (
                  <tr
                    key={row.format}
                    className={`border-b border-tp-border/50 last:border-b-0 ${row.accent ? 'bg-tp-mark/10' : ''}`}
                  >
                    <td className="px-5 py-3.5 text-tp-fg">
                      <div className="flex items-center gap-2">
                        <span className="font-sans">{row.format}</span>
                        {row.accent && (
                          <span className="rounded-full bg-tp-accent px-1.5 py-px font-mono text-[9px] tracking-wider text-tp-accent-fg uppercase">
                            tp
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tp-elev2">
                          <div
                            className={`h-full ${row.accent ? 'bg-tp-accent' : 'bg-tp-soft'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-20 text-right text-tp-fg tabular-nums">
                          {fmt(row.wire)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-tp-muted tabular-nums">
                      {row.encode}
                    </td>
                    <td className="px-5 py-3.5 text-right text-tp-fg tabular-nums">{row.decode}</td>
                    <td className="px-5 py-3.5 font-sans text-[12px] text-tp-muted">{row.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-3xl text-[12.5px] leading-relaxed text-tp-muted">
          For transports that don&apos;t natively decode brotli (Service Worker cache, postMessage,
          IndexedDB, inline data URIs, R2 / KV with no transcoding), the streaming-overlap is the
          win TokenPack actually delivers.{' '}
          <span className="font-mono text-tp-fg">yarn benchmark</span> in the repo to run it against
          your own assets.
        </p>
      </div>
    </section>
  )
}

interface HeadlineProps {
  label: string
  value: string
  detail: string
}

function Headline({ label, value, detail }: HeadlineProps) {
  return (
    <div className="bg-tp-bg p-5">
      <div className="text-[10px] tracking-[0.18em] text-tp-muted uppercase">{label}</div>
      <div className="mt-2 font-mono text-[26px] leading-none tracking-tight text-tp-fg">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-tp-muted">{detail}</div>
    </div>
  )
}
