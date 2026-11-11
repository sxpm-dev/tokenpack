const COLUMNS = [
  { id: 'tokenpack', label: 'TokenPack', accent: true },
  { id: 'zip', label: 'zip / tar.gz', accent: false },
  { id: 'brotli', label: 'brotli (raw)', accent: false },
  { id: 'vector', label: 'vector DB', accent: false },
  { id: 's3', label: 'S3 + signed URL', accent: false },
]

interface Row {
  capability: string
  values: Record<string, string | true | false>
}

const ROWS: Row[] = [
  {
    capability: 'Multiple files in one artifact',
    values: { tokenpack: true, zip: true, brotli: false, vector: 'chunks', s3: false },
  },
  {
    capability: 'Streaming decode during transfer',
    values: { tokenpack: true, zip: false, brotli: 'HTTP only', vector: false, s3: false },
  },
  {
    capability: 'Selective read without unpacking everything',
    values: { tokenpack: true, zip: 'central dir', brotli: false, vector: true, s3: true },
  },
  {
    capability: 'Range-fetch (HTTP bytes=)',
    values: { tokenpack: true, zip: false, brotli: false, vector: false, s3: true },
  },
  {
    capability: 'Travels through chat / paste / image pipes',
    values: { tokenpack: true, zip: false, brotli: false, vector: false, s3: false },
  },
  {
    capability: 'Content-addressed (pin a hash)',
    values: {
      tokenpack: true,
      zip: 'sha externally',
      brotli: 'sha externally',
      vector: false,
      s3: 'sha externally',
    },
  },
  {
    capability: 'Static-host friendly (CDN / R2 / Pages)',
    values: { tokenpack: true, zip: true, brotli: true, vector: false, s3: true },
  },
  {
    capability: 'Browser-native decode',
    values: { tokenpack: true, zip: 'JS', brotli: 'Accept-Encoding', vector: false, s3: 'JS' },
  },
  {
    capability: 'No auth / no IAM',
    values: { tokenpack: true, zip: true, brotli: true, vector: false, s3: false },
  },
  {
    capability: 'Diff-versioned updates',
    values: { tokenpack: true, zip: false, brotli: false, vector: false, s3: false },
  },
]

function renderValue(v: string | boolean): React.ReactNode {
  if (v === true)
    return (
      <span className="inline-flex items-center gap-1 text-tp-fg">
        <span className="font-mono text-tp-accent">●</span>
      </span>
    )
  if (v === false)
    return (
      <span className="inline-flex items-center gap-1 text-tp-soft">
        <span className="font-mono">○</span>
      </span>
    )

  return <span className="font-mono text-[12px] text-tp-muted">{v}</span>
}

const REASONS = [
  {
    head: 'A manifest, not a stat header.',
    body: 'A zip has a central directory listing file names and sizes. A TokenPack router has a real JSON manifest you can inspect, version, and treat as data.',
  },
  {
    head: 'Travels through pipes that reject blobs.',
    body: "Chat threads, image hosts, screenshot CDNs, preview embeds. An Image Token goes through all of them; a `.zip` doesn't.",
  },
  {
    head: 'Streaming overlap, not file-size theater.',
    body: "Streaming image tokens emit a useful payload while bytes still arrive. zip-on-the-wire can't stream; brotli-on-the-wire needs HTTP support.",
  },
  {
    head: 'Diff updates are protocol-native.',
    body: 'A diff token is itself an Image Token. Producer and consumer run the same library. zip has no native diff; tar has nothing.',
  },
]

function inlineCode(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let cursor = 0
  let key = 0

  for (const match of text.matchAll(/`([^`]+)`/g)) {
    const start = match.index ?? 0

    if (start > cursor) parts.push(text.slice(cursor, start))
    parts.push(
      <code
        key={`c-${key++}`}
        className="rounded border border-tp-border bg-tp-elev px-1 py-px font-mono text-[0.85em]"
      >
        {match[1]}
      </code>,
    )
    cursor = start + match[0].length
  }
  if (cursor < text.length) parts.push(text.slice(cursor))

  return parts
}

export function CompareTable() {
  return (
    <section className="border-b border-tp-border bg-tp-bg">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <header className="mb-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-3 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § Versus the alternatives
            </div>
            <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.025em]">
              For orchestration,{' '}
              <span className="italic-display text-tp-muted">a token beats an archive.</span>
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-tp-muted">
              Zip, tar, and brotli are good at compression. They were not designed for the shape of{' '}
              <em>multi-step agent workflows</em>: selective reads, host-crossing transport, partial
              updates, content-addressed reproducibility. TokenPack puts those problems first.
            </p>
          </div>
          <aside className="rounded-lg border border-tp-border bg-tp-elev p-5">
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
          </aside>
        </header>

        {/* Narrative reasons */}
        <div className="mb-10 grid gap-px overflow-hidden rounded-lg border border-tp-border bg-tp-border md:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(reason => (
            <article key={reason.head} className="bg-tp-bg p-5">
              <h3 className="mb-2 text-[14px] leading-tight font-medium tracking-tight">
                {reason.head}
              </h3>
              <p className="text-[12.5px] leading-relaxed text-tp-muted">
                {inlineCode(reason.body)}
              </p>
            </article>
          ))}
        </div>

        <div className="mb-4 text-[10px] tracking-[0.18em] text-tp-muted uppercase">
          § Capability matrix
        </div>
        <p className="mb-5 max-w-2xl text-[13px] text-tp-muted">
          Filled cell = supported natively. Open circle = not without a wrapper. Text = &ldquo;yes,
          with caveat.&rdquo;
        </p>

        <div className="overflow-x-auto rounded-lg border border-tp-border">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-b border-tp-border bg-tp-elev">
                <th className="px-4 py-3 text-left font-medium text-tp-muted">Capability</th>
                {COLUMNS.map(col => (
                  <th
                    key={col.id}
                    className={`px-4 py-3 text-left font-medium ${col.accent ? 'text-tp-fg' : 'text-tp-muted'}`}
                  >
                    <span className="block">{col.label}</span>
                    {col.accent && (
                      <span className="block text-[10px] tracking-[0.1em] text-tp-accent uppercase">
                        this format
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.capability}
                  className={`border-b border-tp-border/60 last:border-b-0 ${i % 2 === 0 ? 'bg-tp-bg' : 'bg-tp-elev2'}`}
                >
                  <td className="px-4 py-3 text-tp-fg">{row.capability}</td>
                  {COLUMNS.map(col => (
                    <td key={col.id} className={`px-4 py-3 ${col.accent ? 'bg-tp-mark/10' : ''}`}>
                      {renderValue(row.values[col.id]!)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-[12.5px] text-tp-muted">
          The point: TokenPack isn&apos;t trying to replace S3 for blob storage or a vector DB for
          semantic retrieval. It collapses{' '}
          <span className="italic-display text-tp-fg">distribution</span> of multi-file artifacts
          into a single self-describing image.
        </p>
      </div>
    </section>
  )
}
