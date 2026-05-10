import { Surface } from '@heroui/react'

interface DefProps {
  term: string
  children: React.ReactNode
}

function Def({ term, children }: DefProps) {
  return (
    <div className="space-y-1">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-white/55">{term}</dt>
      <dd className="text-[11px] leading-4 text-white/45">{children}</dd>
    </div>
  )
}

export function MetricLegend() {
  return (
    <Surface className="rounded-2xl p-4 space-y-3">
      <div className="text-[10px] text-white/30 uppercase tracking-widest">
        Legend — what each metric measures
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Def term="Speed">
          End-to-end wall time from request start until decoded payload is ready. This is the main
          fastest-to-usable-bytes metric.
        </Def>
        <Def term="Fetch">
          Time spent receiving bytes from the throttled server. Batch rows decode after this
          finishes; stream rows decode while this is happening.
        </Def>
        <Def term="Decode tail">
          Batch: CPU decode after full fetch. Stream: leftover decode after the last network byte.
          Near-zero means decode kept up with transfer.
        </Def>
        <Def term="Encode">
          Time to create the artifact from original content. Archives measure compression; tokens
          include token/container creation.
        </Def>
        <Def term="Size">Bytes transferred over the wire for the artifact or archive.</Def>
        <Def term="Ratio">Size divided by original content size. Lower is better.</Def>
        <Def term="Path">
          <span className="font-mono text-white/60">batch</span> fetches the full artifact before
          decode. <span className="font-mono text-white/60">stream</span> decodes while bytes
          arrive.
        </Def>
        <Def term="Codec">
          Exact compression mode used, such as deflate-6, deflate-9, brotli-11, or none.
        </Def>
      </dl>
      <p className="border-t border-white/10 pt-3 text-[11px] leading-4 text-white/40">
        Traditional archives are not image-based. Token rows may use image containers, but Speed
        measures when decoded content is ready, not visual image rendering.
      </p>
    </Surface>
  )
}
