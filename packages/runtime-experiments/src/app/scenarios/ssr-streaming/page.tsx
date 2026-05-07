// SSR-streaming scenario — custom override page (Server Component).
//
// Reads the pre-generated JSON + TokenPack PNG fixtures from disk on every
// request, base64-encodes the PNG, and inlines BOTH into the streamed HTML:
//   • JSON in a `<script type="application/json">` tag
//   • PNG as a `data:image/png;base64,…` URI on a hidden `<img>`, with a
//     matching `<link rel="preload" as="image">` in the head so the browser
//     starts decoding off-thread before the body is parsed.
//
// The client measurement component reads both forms after mount and reports
// "HTML body parsed → JS object ready" wall time for each path.
//
// This page is a literal route, so Next.js prefers it over the generic
// `[scenarioId]/page.tsx` (literal segments win over dynamic).

import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import fs from 'fs'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import path from 'path'

import { ssrStreamingScenario } from '@/scenarios/ssr-streaming'

import { SsrStreamingClient } from './components/SsrStreamingClient'

const FIXTURE_DIR = path.join(process.cwd(), 'runtime-fixtures', 'ssr-streaming')
const JSON_FIXTURE = 'payload-100kb.json'
const PNG_FIXTURE = 'payload-100kb.tokenpack-deflate.png'

export const dynamic = 'force-dynamic'

export default function SsrStreamingPage() {
  const jsonPath = path.join(FIXTURE_DIR, JSON_FIXTURE)
  const pngPath = path.join(FIXTURE_DIR, PNG_FIXTURE)

  if (!fs.existsSync(jsonPath) || !fs.existsSync(pngPath)) {
    notFound()
  }

  const jsonBytes = fs.readFileSync(jsonPath)
  const pngBytes = fs.readFileSync(pngPath)
  const jsonText = jsonBytes.toString('utf-8')
  const pngDataURI = `data:image/png;base64,${pngBytes.toString('base64')}`

  const sizes = {
    jsonBytes: jsonBytes.byteLength,
    pngBytes: pngBytes.byteLength,
    pngDataURIBytes: pngDataURI.length,
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 space-y-5">
      <Link
        className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70"
        href="/"
      >
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{ssrStreamingScenario.name}</h1>
        <p className="mt-1 text-sm text-white/50">{ssrStreamingScenario.description}</p>
      </div>

      {/*
        Inlined data-bearers. Both rendered server-side, so by the time the
        client component mounts, both are reachable in the DOM.
      */}
      <script
        dangerouslySetInnerHTML={{ __html: jsonText }}
        id="ssr-payload-json"
        type="application/json"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        alt=""
        height={1}
        id="ssr-payload-png"
        src={pngDataURI}
        style={{ display: 'none' }}
        width={1}
      />

      <SsrStreamingClient
        explanation={ssrStreamingScenario.explanation}
        sizes={sizes}
        variants={ssrStreamingScenario.variants.map(v => ({
          id: v.id,
          label: v.label,
          compat: v.compat,
          detail: v.detail,
        }))}
      />
    </main>
  )
}
