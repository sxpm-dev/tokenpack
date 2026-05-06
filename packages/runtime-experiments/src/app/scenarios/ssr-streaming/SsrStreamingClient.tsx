'use client'

import { decode } from '@tokenpack/browser'

import { ScenarioRunner, type Variant } from '@/components/ScenarioRunner'
import { formatBytes } from '@/lib/measure'

interface Props {
  tokenDataURL: string
  tokenBytes: number
  jsonBytes: number
  sizeKB: number
}

export function SsrStreamingClient({ tokenDataURL, tokenBytes, jsonBytes, sizeKB }: Props) {
  const variants: Variant[] = [
    {
      label: 'JSON via <script type="application/json">',
      run: async () => {
        const t0 = performance.now()
        const el = document.getElementById('tp-ssr-json')

        if (!el) throw new Error('SSR script tag not found')
        const text = el.textContent ?? ''

        JSON.parse(text)

        return { ms: performance.now() - t0, bytes: jsonBytes }
      },
    },
    {
      label: 'TokenPack via SSR-shipped data URI',
      run: async () => {
        const t0 = performance.now()
        const result = await decode(tokenDataURL)

        if (result.type !== 'file') throw new Error('expected file token')
        JSON.parse(new TextDecoder().decode(result.payload))

        return { ms: performance.now() - t0, bytes: tokenBytes }
      },
    },
  ]

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
        <div className="text-white/40 uppercase tracking-widest mb-2">SSR payload</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-white/40 text-[10px]">Payload</div>
            <div className="text-white/80 tabular-nums">{sizeKB}KB JSON</div>
          </div>
          <div>
            <div className="text-white/40 text-[10px]">JSON wire bytes</div>
            <div className="text-white/80 tabular-nums">{formatBytes(jsonBytes)}</div>
          </div>
          <div>
            <div className="text-white/40 text-[10px]">TokenPack wire bytes</div>
            <div className="text-green-400 tabular-nums">{formatBytes(tokenBytes)}</div>
          </div>
        </div>
      </div>

      <ScenarioRunner defaultIterations={20} variants={variants} />

      <details className="text-xs text-white/40">
        <summary className="cursor-pointer hover:text-white/60">Methodology</summary>
        <ul className="mt-3 space-y-2 list-disc list-inside leading-relaxed">
          <li>Both forms ship inline in the SSR HTML — no extra round-trips.</li>
          <li>
            JSON variant: locate the <code>&lt;script type=&quot;application/json&quot;&gt;</code>{' '}
            tag, read textContent, JSON.parse.
          </li>
          <li>
            TokenPack variant: <code>decode(dataURL)</code> via createImageBitmap + canvas + core
            decode + JSON.parse.
          </li>
          <li>
            The TokenPack <code>&lt;link rel=&quot;preload&quot; as=&quot;image&quot;&gt;</code>{' '}
            hints the browser to start fetching/decoding immediately on document parse.
          </li>
          <li>
            The SSR encoding currently uses <code>@tokenpack/browser</code> which falls back to
            OffscreenCanvas — this works in some Node-runtime hosts (Bun, Deno, Workers) but fails
            on plain Node. For production, encode with <code>@tokenpack/node</code> + base64-encode
            to data URI.
          </li>
        </ul>
      </details>
    </div>
  )
}
