const BENEFITS = [
  {
    title: 'It survives image-shaped pipes.',
    body: 'An Image Token can move through chat, preview systems, CDNs, screenshots, docs, and browser surfaces that treat arbitrary archives as suspicious or invisible.',
  },
  {
    title: 'It is still a real data container.',
    body: 'The image is not decoration alone. TokenPack gives it a manifest, file list, byte readers, optional encryption, and stable decode APIs on both Node and browser runtimes.',
  },
  {
    title: 'It can stream and range-fetch.',
    body: 'Small tokens decode as one artifact. Larger router tokens split into manifest and chunk images, so consumers can read only the file or byte range they need.',
  },
  {
    title: 'It is easy to cache, copy, and pin.',
    body: 'Image Tokens are static files. Put them on a CDN, attach them to an agent handoff, content-address them, diff them, or mirror them without a service contract.',
  },
]

export function WhyPngToken() {
  return (
    <section className="border-b border-tp-border">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <header className="mb-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § Why Image Token?
            </div>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
              A familiar image format.
              <br />
              <span className="italic-display text-tp-muted">A programmable payload.</span>
            </h2>
          </div>

          <p className="text-[15px] leading-relaxed text-tp-muted">
            Image files are boring in the best way: browsers understand them, CDNs cache them, tools
            preview them, and people know how to pass it around. TokenPack uses that boring
            transport as a self-contained data artifact, so code, docs, JSON, bundles, and agent
            handoffs can move through places where a zip, database, or signed URL is too heavy.
          </p>
        </header>

        <div className="grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border md:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, index) => (
            <article key={benefit.title} className="bg-tp-bg p-6">
              <div className="mb-5 font-mono text-[11px] text-tp-soft">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="mb-3 text-[16px] leading-tight font-medium tracking-tight">
                {benefit.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-tp-muted">{benefit.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
