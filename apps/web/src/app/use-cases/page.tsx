import Link from 'next/link'

import { workflowGuides } from '@/lib/workflow-guides'

export const metadata = { title: 'Workflow guides' }

export default function UseCasesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-medium">Workflow guides</h1>
      <p className="mt-5 text-base leading-relaxed text-tp-muted">
        Package configuration, data and application files together, then restore them in another
        environment. These ten small, synthetic examples include source files, downloadable packs,
        verification and the integration work each application still needs.
      </p>
      <p className="mt-4 text-base leading-relaxed text-tp-muted">
        Start with configuration or artifact data. The value is preserving usable state; performance
        depends on what the reader needs to load. A JSON file or ZIP archive may be the simpler
        choice when image transport and selective access add no value.
      </p>
      <ol className="mt-10 divide-y divide-tp-border border-y border-tp-border">
        {workflowGuides.map(guide => (
          <li key={guide.slug} className="py-5">
            <Link
              className="text-lg font-medium underline underline-offset-4 hover:text-tp-accent focus-visible:outline-2"
              href={`/use-cases/${guide.slug}`}
            >
              {guide.title}
            </Link>
            <p className="mt-2 text-sm leading-relaxed text-tp-muted">{guide.summary}</p>
          </li>
        ))}
      </ol>
      <section className="prose mt-10">
        <h2>What these examples prove</h2>
        <p>
          The generator encodes and restores every source file, compares every byte, and checks a
          case-specific data invariant. The browser check verifies the same generated pack. Neither
          check proves a third-party integration or compatibility with a chat or email service.
        </p>
        <h2>Moving a pack between tools</h2>
        <p>
          Send the original attachment. Resizing, screenshots, image optimization and metadata
          removal can destroy the payload. Compare its SHA-256 against a trusted sender value. An
          ordinary image viewer displays the image; it does not restore or run its contents.
        </p>
        <p>
          These pages are pre-rendered at build time. Their downloadable examples are generated with
          the example runner and committed alongside the site. The browser check needs only static
          files and the decoder, with no benchmark server.
        </p>
        <p>
          <Link href="/docs/quickstart">Read the API quickstart</Link> or open the{' '}
          <Link href="/playground/files">file explorer</Link> to inspect a downloaded pack.
        </p>
      </section>
    </main>
  )
}
