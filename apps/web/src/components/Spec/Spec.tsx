const BYTES_FILE = [
  { range: '0..4', label: 'signature', value: 'C0 DE AE 54', kind: 'magic' },
  { range: '4', label: 'format', value: '01 file', kind: 'flag' },
  { range: '5..9', label: 'manifest length', value: 'u32 LE', kind: 'len' },
  { range: '9..N', label: 'manifest', value: 'JSON', kind: 'json' },
  { range: 'N..', label: 'regions', value: 'compressed payload', kind: 'data' },
]

const BYTES_TPAK = [
  { range: '0..4', label: 'magic', value: 'TPK1', kind: 'magic' },
  { range: '4..6', label: 'algorithm id', value: 'u16 BE · 101 = deflate', kind: 'id' },
  { range: '6', label: 'level', value: 'u8 · 4 → deflate-9', kind: 'flag' },
  { range: '7..11', label: 'uncompressed length', value: 'u32 BE', kind: 'len' },
  { range: '11..', label: 'payload', value: 'zlib-wrapped DEFLATE', kind: 'data' },
]

export function Spec() {
  return (
    <section className="relative border-b border-tp-border bg-tp-elev2">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <header className="mb-12 max-w-2xl">
          <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § On the wire
          </div>
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
            Byte layouts. <span className="italic-display text-tp-muted">No surprises.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-tp-muted">
            Two formats define the protocol. The pack format wraps multi-file payloads inside a
            single token. The <code className="font-mono text-tp-fg">tpAK</code> body sits in an
            image ancillary chunk so consumers can find it by walking chunks, not pixels.
          </p>
        </header>

        <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border lg:grid-cols-2">
          <ByteTable
            footer="Anonymous file-format tokens (no name) skip the wrapper entirely — raw payload bytes inside the image, for backward compat with pre-spec tokens."
            rows={BYTES_FILE}
            subtitle="(2) pack | (3) diff variants share the envelope"
            title="Pack format · 0x01 file"
          />
          <ByteTable
            footer={`Pixels are decoration — gradient, data-art, or placeholder. The payload lives in the tpAK chunk so range-fetch works on the raw file bytes, no image decoder required.`}
            rows={BYTES_TPAK}
            subtitle={`pixel-range-* algorithms`}
            title="tpAK body · in-image side channel"
          />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border md:grid-cols-3">
          <CompressionRow algo="0" family="none" note="no decompression" />
          <CompressionRow algo="1" family="deflate" note="level 6 · zlib-wrapped" />
          <CompressionRow algo="2" family="brotli" note="quality 11" />
          <CompressionRow algo="3" family="deflate" note="level 1" />
          <CompressionRow algo="4" family="deflate" note="level 9 · default" />
          <CompressionRow algo="5" family="brotli" note="quality 4" />
        </div>
      </div>
    </section>
  )
}

interface ByteTableProps {
  title: string
  subtitle: string
  rows: typeof BYTES_FILE
  footer: string
}

function ByteTable({ title, subtitle, rows, footer }: ByteTableProps) {
  return (
    <article className="flex flex-col gap-4 bg-tp-bg p-7">
      <header>
        <h3 className="text-[15px] font-medium tracking-tight">{title}</h3>
        <p className="font-mono text-[11px] tracking-[0.05em] text-tp-muted uppercase">
          {subtitle}
        </p>
      </header>
      <table className="text-[13px]">
        <thead>
          <tr className="border-b border-tp-border text-[10px] tracking-[0.12em] text-tp-muted uppercase">
            <th className="w-24 py-2 pr-3 text-left font-medium">offset</th>
            <th className="py-2 pr-3 text-left font-medium">field</th>
            <th className="py-2 text-left font-medium">value</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map(row => (
            <tr key={row.range} className="border-b border-tp-border/60 last:border-b-0">
              <td className="py-2 pr-3 text-tp-soft">{row.range}</td>
              <td className="py-2 pr-3 text-tp-fg">{row.label}</td>
              <td className="py-2 text-tp-muted">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[12.5px] leading-relaxed text-tp-muted">{footer}</p>
    </article>
  )
}

interface CompressionRowProps {
  algo: string
  family: string
  note: string
}

function CompressionRow({ algo, family, note }: CompressionRowProps) {
  return (
    <div className="flex items-baseline gap-4 bg-tp-bg p-4">
      <span className="font-mono text-[11px] text-tp-soft">level {algo}</span>
      <span className="font-mono text-[13px] text-tp-fg">{family}</span>
      <span className="ml-auto text-[12px] text-tp-muted">{note}</span>
    </div>
  )
}
