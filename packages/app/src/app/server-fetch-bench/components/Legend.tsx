import { Surface } from '@heroui/react'

interface DefProps {
  term: string
  children: React.ReactNode
}

function Def({ term, children }: DefProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-white/55">{term}</dt>
      <dd className="text-[11px] leading-4 text-white/45">{children}</dd>
    </div>
  )
}

export function Legend() {
  return (
    <Surface className="rounded-2xl p-4 space-y-3">
      <div className="text-[10px] text-white/30 uppercase tracking-widest">Legend</div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Def term="TTFB">
          Time to First Byte — wall time from request start until the first network byte arrives.
          Captures latency + server response, excludes payload transfer.
        </Def>

        <Def term="1st byte">
          Time to first <em>decoded</em> byte — when downstream code can start consuming data. For
          batch scenarios this equals <span className="font-mono text-white/60">total</span> (no
          overlap). For streaming scenarios it&apos;s much earlier — the streaming codec emits
          decoded bytes while bytes are still arriving, so the consumer sees data sooner than the
          file finishes downloading.
        </Def>

        <Def term="Total">
          End-to-end wall time: from request start until the last decoded byte is produced. The
          fairest single number to compare scenarios.
        </Def>

        <Def term="Decode">
          <span className="text-white/60">Batch</span> (<span className="font-mono">max-*</span>,
          <span className="font-mono">zip</span>, <span className="font-mono">tar.gz</span>,{' '}
          <span className="font-mono">deflate</span>, <span className="font-mono">brotli-*</span>):
          pure CPU decode time, measured <em>after</em> the entire response is downloaded.
          <br />
          <span className="text-white/60">Stream</span> (<span className="font-mono">stream-*</span>
          ): residual decode tail <em>after</em> the last network byte arrives. Approaches 0 when
          decode keeps up with download — the work happened in parallel with the transfer.
        </Def>

        <Def term="Transfer">
          Total bytes pulled from the throttled HTTP server (the on-the-wire size of the token /
          archive).
        </Def>

        <Def term="MB/s">
          Effective throughput: original (uncompressed) bytes ÷ total wall time. Higher is better.
        </Def>
      </dl>
    </Surface>
  )
}
