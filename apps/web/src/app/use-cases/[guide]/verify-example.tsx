'use client'

import { useState } from 'react'

import { sitePath } from '@/lib/site-path'

type Verification = {
  sha256: string
  files: { path: string; sha256: string; byteLength: number }[]
}

async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes))

  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export function VerifyExample({ slug }: { slug: string }) {
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const base = sitePath(`/examples/workflows/${slug}`)

  async function verify() {
    setRunning(true)
    setMessage('Downloading and decoding the example…')
    setFiles([])
    try {
      const [{ decode }, image, record] = await Promise.all([
        import('@tokenpack/browser'),
        fetch(`${base}.png`),
        fetch(`${base}.json`),
      ])

      if (!image.ok || !record.ok)
        throw new Error(
          'Example files are unavailable. Regenerate the workflow examples and reload.',
        )
      const bytes = new Uint8Array(await image.arrayBuffer())
      const expected = (await record.json()) as Verification

      if ((await sha256(bytes)) !== expected.sha256) throw new Error('Pack checksum mismatch.')
      const pack = await decode(bytes)

      if (!pack.isPack()) throw new Error('Expected a directory pack.')
      if (pack.list.length !== expected.files.length) throw new Error('File count mismatch.')
      for (const file of expected.files) {
        const restored = await pack.extract(file.path)

        if (restored.length !== file.byteLength || (await sha256(restored)) !== file.sha256)
          throw new Error(`Restored content differs: ${file.path}`)
      }
      setFiles(expected.files.map(file => file.path))
      setMessage(
        `Verified ${expected.files.length} files. Every restored byte matches the generated example.`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Verification failed. Try downloading the example again.',
      )
    } finally {
      setRunning(false)
    }
  }

  return (
    <section aria-labelledby="verify-heading" className="mt-10 border-t border-tp-border pt-6">
      <h2 className="text-xl font-medium" id="verify-heading">
        Try the actual pack
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-tp-muted">
        Decode this sample in your browser and compare its files with the generated checksums. This
        checks restoration; it does not execute embedded application code or certify sender
        identity.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <button
          className="rounded-md border border-tp-border px-4 py-2 text-sm hover:bg-tp-elev focus-visible:outline-2 disabled:opacity-50"
          disabled={running}
          onClick={verify}
        >
          {running ? 'Verifying…' : 'Verify example in browser'}
        </button>
        <a download className="text-sm underline underline-offset-4" href={`${base}.png`}>
          Download pack
        </a>
        <a download className="text-sm underline underline-offset-4" href={`${base}.json`}>
          Verification JSON
        </a>
      </div>
      <p className="mt-4 text-sm leading-relaxed" role="status">
        {message}
      </p>
      {files.length > 0 && (
        <ul className="mt-3 list-inside list-disc text-sm">
          {files.map(file => (
            <li key={file}>
              <code>{file}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
