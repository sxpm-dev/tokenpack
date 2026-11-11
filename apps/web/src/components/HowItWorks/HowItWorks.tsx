import { DiffApplyDiagram } from '@/components/Rough/DiffApplyDiagram'
import { ParallelStreamDiagram } from '@/components/Rough/ParallelStreamDiagram'
import { RouterEncoderDiagram } from '@/components/Rough/RouterEncoderDiagram'

import { AlgorithmComparison } from './AlgorithmComparison'
import { DecodeBlock as DecodeShowcase } from './DecodeBlock'
import { MaterializeBlock } from './MaterializeBlock'

export async function HowItWorks() {
  return (
    <section className="border-b border-tp-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <header className="mb-16 max-w-3xl">
          <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
            § How it works
          </div>
          <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
            Encode content into a token.{' '}
            <span className="italic-display text-tp-muted">Decode it back, anywhere.</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-tp-muted">
            Tokens are image-friendly pipes — they travel through chat threads, CDNs, Service Worker
            caches, agent contexts. On the other side, the runtime{' '}
            <span className="text-tp-fg">fetches</span> the parts you need,{' '}
            <span className="text-tp-fg">routes</span> between chunks, and{' '}
            <span className="text-tp-fg">materializes</span> files into your app. Below is the
            protocol, stage by stage.
          </p>
        </header>

        {/* Algorithm families — top-level overview before the staged blocks */}
        <div className="mb-20">
          <div className="mb-6 flex items-baseline gap-3">
            <span className="rounded-full border border-tp-border bg-tp-elev px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-tp-muted uppercase">
              Two algorithm families
            </span>
            <span className="h-px flex-1 bg-tp-border" />
          </div>
          <h3 className="mb-3 max-w-3xl text-[clamp(1.3rem,2.2vw,1.9rem)] leading-[1.15] font-medium tracking-[-0.02em]">
            Where the bytes live.
          </h3>
          <p className="mb-8 max-w-3xl text-[14.5px] leading-relaxed text-tp-muted">
            Two distinct strategies underneath the encoder.{' '}
            <strong className="text-tp-fg">linear-deflate</strong> writes compressed bytes into the
            image&apos;s pixel data — the image <em>is</em> the data.{' '}
            <strong className="text-tp-fg">pixel-range</strong> writes bytes into a private image
            ancillary chunk (<code className="font-mono text-tp-fg">tpAK</code>); the pixels are
            decoration. Each family wins different jobs.
          </p>
          <AlgorithmComparison />
        </div>

        <div className="flex flex-col gap-24">
          {/* 01 — ENCODE PLANNER */}
          <Block
            description="When you encode many files, the planner decides how to pack them. Tiny files (< 32 KB) sort by directory and pack contiguously into shared chunks for locality. Medium files get their own chunk. Big files (> 1 MB compressed) split across multiple chunks so the consumer can range-fetch them in parallel. Target chunk size: 1 MB."
            heading="Tiny files cluster. Big files split."
            n="01"
            stage="Encode planner"
          >
            <RouterEncoderDiagram />
          </Block>

          {/* 02 — DECODE */}
          <Block
            description="Hand decode() any image source — URL, Blob, Buffer, ArrayBuffer, ImageBitmap, even an <img> already in the DOM. The result is a Pack: text() / json() / list() / bytes() read your data directly. For router tokens, use decodeRouter() — it gives you list / materialize / stream over chunks."
            heading="decode(image) → Pack."
            n="02"
            stage="Decode"
          >
            <DecodeShowcase />
          </Block>

          {/* 04 — MATERIALIZE */}
          <Block
            description="router.materialize() takes the named JS / CSS files inside a router token and wires them into the host page. CSS is injected as <style> into <head>; JS is executed in <body>. The result: a prototype, a generated UI, an LLM-built tool — running in your DOM without a build step, deploy pipeline, or extension."
            heading="One call. Your DOM is running the app."
            n="04"
            stage="Materialize"
          >
            <MaterializeBlock />
          </Block>

          {/* 05 — DIFF */}
          <Block
            description="A diff token is a small Image Token that describes add / modify / delete / rename ops against a base pack. Apply it to v1.0.0 and you reconstruct v1.0.1 exactly — no full re-download. Real example: a webapp ships its 3.2 MB bundle once. Every release after that is a few KB of diff. The client caches v1.0.0 and applies subsequent diffs locally."
            heading="Diffs are tokens too. Releases ship as KB, not MB."
            n="05"
            stage="See diff · apply diff"
          >
            <DiffApplyDiagram />
          </Block>

          {/* 06 — STREAMING */}
          <Block
            description="When a big file is split across N chunks at encode time, the runtime planner detects that and issues N parallel HTTP Range requests on decode. Each chunk arrives in parallel; the decoder reassembles bytes using the manifest's fileOffset hints. From your code's perspective, you call router.text(path) and get bytes — the parallel fetch + reassembly happens under the hood. Same applies to streaming image decode: bytes start inflating before the network finishes."
            heading="Parallel fetches under the hood. Your code is unchanged."
            n="06"
            stage="Streaming · parallel segments"
          >
            <ParallelStreamDiagram />
          </Block>
        </div>
      </div>
    </section>
  )
}

interface BlockProps {
  n: string
  stage: string
  heading: string
  description: string
  children: React.ReactNode
}

function Block({ n, stage, heading, description, children }: BlockProps) {
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[12px] text-tp-soft">{n}</span>
          <span className="rounded-full border border-tp-border bg-tp-elev px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] text-tp-muted uppercase">
            {stage}
          </span>
          <span className="h-px flex-1 bg-tp-border" />
        </div>
        <h3 className="max-w-3xl text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.15] font-medium tracking-[-0.02em]">
          {heading}
        </h3>
        <p className="max-w-3xl text-[14.5px] leading-relaxed text-tp-muted">{description}</p>
      </header>
      {children}
    </article>
  )
}
