'use client'

import { Button } from '@heroui/react'
import { ArrowLeftIcon } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ScenarioRunner, type Variant } from '@/components/ScenarioRunner'
import { encode } from '@tokenpack/browser'
import { decode } from '@tokenpack/browser'
import { generatePayload } from '@/lib/payloads'

export default function InlineDataUriPage() {
  const [size, setSize] = useState<10 | 100 | 1000>(100)
  const [variants, setVariants] = useState<Variant[] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const variants = await buildVariants(size)
      if (!cancelled) setVariants(variants)
    })()
    return () => { cancelled = true }
  }, [size])

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 mb-6">
        <ArrowLeftIcon size={14} /> All scenarios
      </Link>

      <h1 className="text-xl font-semibold tracking-tight">Inline data URI</h1>
      <p className="mt-1 text-sm text-white/45 leading-relaxed">
        How fast can the browser turn an embedded payload into a JS object? Compares base64-raw, base64-brotli-decompressed-in-JS,
        and a TokenPack PNG inlined as a data URI. The headline metric is{' '}
        <span className="text-white/70">data-URI-string → JS object ready</span>.
      </p>

      <div className="my-6 flex items-center gap-2 text-xs">
        <span className="text-white/40 mr-2">Payload size:</span>
        {([10, 100, 1000] as const).map(s => (
          <Button
            key={s}
            size="sm"
            variant={size === s ? 'primary' : 'ghost'}
            onPress={() => setSize(s)}
          >
            {s}KB
          </Button>
        ))}
      </div>

      {!variants ? (
        <div className="text-white/30 text-sm py-6 animate-pulse">Preparing fixtures for {size}KB…</div>
      ) : (
        <ScenarioRunner variants={variants} defaultIterations={10} />
      )}

      <details className="mt-8 text-xs text-white/40">
        <summary className="cursor-pointer hover:text-white/60">Notes on methodology</summary>
        <ul className="mt-3 space-y-2 list-disc list-inside leading-relaxed">
          <li>Payload is a JSON object of ≈{size}KB pre-randomized (deterministic seed) once on page load.</li>
          <li>Each variant measures end-to-end time from "I have the encoded form in memory" to "I have a JSON object I can use."</li>
          <li>For TokenPack: data URI → fetch → createImageBitmap → canvas getImageData → core decode → JSON.parse.</li>
          <li>For base64-brotli: base64 → atob → brotli decompress (DecompressionStream) → JSON.parse.</li>
          <li>For base64-raw: base64 → atob → JSON.parse.</li>
          <li>Brotli native fallback: if <code>DecompressionStream('br')</code> is unsupported (Safari, old Firefox), that variant skips with a marker.</li>
        </ul>
      </details>
    </main>
  )
}

async function buildVariants(sizeKB: 10 | 100 | 1000): Promise<Variant[]> {
  const json = generatePayload(sizeKB)
  const jsonString = JSON.stringify(json)
  const utf8 = new TextEncoder().encode(jsonString)

  // Pre-build the encoded forms once so the bench measures only the decode path.
  const base64Raw = uint8ToBase64(utf8)
  const base64BrotliBytes = await brotliCompress(utf8)
  const base64Brotli = base64BrotliBytes ? uint8ToBase64(base64BrotliBytes) : null

  // TokenPack: encode to PNG, then turn the PNG blob into a data URI for fairness.
  const { blobs } = await encode(jsonString, { algo: 'linear', compressionMode: 'brotli-6' })
  const tokenDataURL = await blobToDataURL(blobs[0])
  const tokenBytes = blobs[0].size

  const variants: Variant[] = [
    {
      label: 'base64-raw + atob + JSON.parse',
      run: async () => {
        const t0 = performance.now()
        const decoded = atob(base64Raw)
        const utf8Out = new Uint8Array(decoded.length)
        for (let i = 0; i < decoded.length; i++) utf8Out[i] = decoded.charCodeAt(i)
        JSON.parse(new TextDecoder().decode(utf8Out))
        return { ms: performance.now() - t0, bytes: base64Raw.length }
      },
    },
  ]

  if (base64Brotli) {
    variants.push({
      label: 'base64-brotli + DecompressionStream + JSON.parse',
      run: async () => {
        const t0 = performance.now()
        const compressedBytes = base64ToUint8(base64Brotli)
        const stream = new Response(compressedBytes as BodyInit).body!.pipeThrough(new DecompressionStream('br' as CompressionFormat))
        const text = await new Response(stream).text()
        JSON.parse(text)
        return { ms: performance.now() - t0, bytes: base64Brotli.length }
      },
    })
  } else {
    variants.push({
      label: 'base64-brotli (UNSUPPORTED — DecompressionStream("br") missing)',
      run: async () => ({ ms: 0, bytes: 0 }),
    })
  }

  variants.push({
    label: 'tokenpack-png-data-uri (createImageBitmap + decode)',
    run: async () => {
      const t0 = performance.now()
      const data = await decode(tokenDataURL)
      JSON.parse(new TextDecoder().decode(data))
      return { ms: performance.now() - t0, bytes: tokenBytes }
    },
  })

  return variants
}

async function brotliCompress(bytes: Uint8Array): Promise<Uint8Array | null> {
  // CompressionStream('br') is supported in Chromium 122+; Safari/Firefox lag.
  try {
    const cs = new CompressionStream('br' as CompressionFormat)
    const stream = new Response(new Blob([bytes as BlobPart])).body!.pipeThrough(cs)
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
