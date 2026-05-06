// SSR-streaming scenario: SSR-shipped TokenPack PNG (as `<img>` data URI) vs
// SSR-shipped JSON (in a hidden DOM element with textContent). The page renders
// both forms server-side; client-side we measure end-to-end "DOM-ready → JS
// object available" for each.

import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { encode } from '@tokenpack/browser'
import type { Metadata } from 'next'
import Link from 'next/link'

import { generatePayload } from '@/lib/payloads'

import { SsrStreamingClient } from './SsrStreamingClient'

export const metadata: Metadata = { title: 'SSR streaming — TokenPack vs JSON' }

async function ssrEncode(payload: unknown): Promise<{
  tokenDataURL: string
  tokenBytes: number
  jsonBytes: number
  jsonString: string
} | null> {
  try {
    const json = JSON.stringify(payload)
    const result = await encode(json, { algo: 'linear', compressionMode: 'brotli-6' })

    return {
      tokenDataURL: result.dataURL,
      tokenBytes: result.blobs[0].size,
      jsonBytes: new TextEncoder().encode(json).length,
      jsonString: json,
    }
  } catch {
    return null
  }
}

export default async function SsrStreamingPage() {
  const sizeKB = 50
  const payload = generatePayload(sizeKB)
  const server = await ssrEncode(payload)

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link
        className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-6"
        href="/"
      >
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <h1 className="text-xl font-semibold tracking-tight">SSR streaming</h1>
      <p className="mt-1 text-sm text-white/45 leading-relaxed">
        Compare SSR-shipping a TokenPack <code>&lt;img&gt;</code> data URI vs SSR-shipping a hidden
        JSON div. The headline metric is{' '}
        <span className="text-white/70">document arrived → JS object usable</span>.
      </p>

      {!server ? (
        <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-200">
          <strong>SSR encode skipped.</strong>
          <p className="mt-2 text-yellow-100/80 leading-relaxed">
            Pre-encoding via <code>@tokenpack/browser</code> requires a browser canvas which isn&apos;t
            available in plain Node. Production: encode via <code>@tokenpack/node</code>&apos;s{' '}
            <code>encodeToBuffer</code> on the server, then base64 → data URI. The benchmark below
            still works once SSR encoding is wired correctly.
          </p>
        </div>
      ) : (
        <>
          {/* Hidden div holding the JSON — textContent-only avoids any HTML injection risk. */}
          <div hidden id="tp-ssr-json">
            {server.jsonString}
          </div>

          {/* Preload the TokenPack image so the browser starts decoding during HTML parse. */}
          <link as="image" href={server.tokenDataURL} rel="preload" />

          <SsrStreamingClient
            jsonBytes={server.jsonBytes}
            sizeKB={sizeKB}
            tokenBytes={server.tokenBytes}
            tokenDataURL={server.tokenDataURL}
          />
        </>
      )}
    </main>
  )
}
