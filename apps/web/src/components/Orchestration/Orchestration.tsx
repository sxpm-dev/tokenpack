const REASONS = [
  {
    n: '01',
    head: 'A manifest, not a stat header.',
    body: "A zip has a central directory listing file names and sizes. A TokenPack router has a real JSON manifest you can inspect, version, and treat as data. Downstream agents query the manifest like a schema; you don't need to peek inside a binary header.",
  },
  {
    n: '02',
    head: 'Selective decode is the point, not a side feature.',
    body: "Both zip and TokenPack let you list entries without unpacking. But TokenPack chunks are byte-addressable on the wire via HTTP Range — fetch the bytes you need, ignore the rest, and never decode pixels you didn't ask for.",
  },
  {
    n: '03',
    head: 'Travels through pipes that reject blobs.',
    body: "Chat threads, image hosts, screenshot CDNs, preview embeds, postMessage to a Service Worker — an Image Token goes through all of them; a `.zip` doesn't. For agent-to-agent handoff that crosses host boundaries, the carrier matters more than the compression ratio.",
  },
  {
    n: '04',
    head: 'Streaming overlap, not file-size theater.',
    body: "Streaming image variants emit a useful payload while bytes are still arriving. On non-HTTP transports — Service Worker cache, IndexedDB, R2 with no transcoding, inline data URIs — that overlap is the win. Zip-on-the-wire can't stream; brotli-on-the-wire requires HTTP support.",
  },
  {
    n: '05',
    head: 'Diff updates are cheap and protocol-native.',
    body: "You don't need to ship a new full bundle every release. A diff token is also an Image Token and carries only the ops. Producer and consumer both run the same library. zip has no native diff. tar has nothing.",
  },
  {
    n: '06',
    head: 'Content-addressed by design.',
    body: "A TokenPack's bytes are stable. Pin the hash; the artifact is bit-exactly reproducible. Versions become a one-line check, not a `git status` against three repos.",
  },
]

export function Orchestration() {
  return (
    <section className="border-b border-tp-border bg-tp-elev2">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <header className="mb-12 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <div>
            <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § Why not just a zip?
            </div>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
              For orchestration,{' '}
              <span className="italic-display text-tp-muted">a token beats an archive.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-tp-muted">
              Zip, tar, and brotli are good at compression. They were not designed for the shape of{' '}
              <em>multi-step agent workflows</em>: selective reads, host-crossing transport, partial
              updates, content-addressed reproducibility. TokenPack puts those problems first.
            </p>
          </div>
          <aside className="rounded-lg border border-tp-border bg-tp-bg p-5">
            <div className="mb-3 text-[10px] tracking-[0.18em] text-tp-muted uppercase">
              We&apos;re not replacing
            </div>
            <ul className="space-y-2 text-[13px] text-tp-muted">
              <li>
                <span className="text-tp-fg">Cold storage</span> · keep using zip/tar
              </li>
              <li>
                <span className="text-tp-fg">Vector retrieval</span> · keep using your vector DB
              </li>
              <li>
                <span className="text-tp-fg">Blob upload</span> · keep using S3 / R2 / GCS
              </li>
              <li>
                <span className="text-tp-fg">HTTP wire compression</span> · brotli is great
              </li>
            </ul>
            <p className="mt-4 text-[12.5px] leading-relaxed text-tp-muted">
              TokenPack sits one layer up — it&apos;s the artifact that travels between humans and
              agents, and the manifest that orchestrators reason about.
            </p>
          </aside>
        </header>

        <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border md:grid-cols-2 lg:grid-cols-3">
          {REASONS.map(reason => (
            <article key={reason.n} className="bg-tp-bg p-7">
              <span className="font-mono text-[11px] text-tp-soft">{reason.n}</span>
              <h3 className="mt-3 text-[16px] leading-tight font-medium tracking-tight">
                {reason.head}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-tp-muted">{reason.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
