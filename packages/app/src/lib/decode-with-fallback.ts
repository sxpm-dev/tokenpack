'use client'

// Unified FE-first / server-fallback decode for the dashboard.
//
// Tries `@tokenpack/browser`'s `decode()` in-process; if it throws (e.g. the
// algorithm needs Brotli encode, or the user's browser is missing
// `DecompressionStream('br')`), POSTs the bytes to `/api/decode` and rebuilds
// the Pack from the server response. Same routing rule as encode: pure tools
// in the libraries, app-layer auto-routing.

import {
  decode,
  type DecodeSource,
  type DirPack,
  encode as browserEncode,
  type EncodeResult,
  type Pack,
} from '@tokenpack/browser'
import { compressRaw } from 'tokenpack/compressors'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import { encodeDiff } from 'tokenpack/pack-format/encode-diff'

import { smartDecompress } from '@/components/Explorer/utils/smart-decompress'
import { extensionForBytes, mimeForBytes } from '@/components/Explorer/utils/sniff-format'

/** Compressor used for diff token region encoding — always FE-friendly. */
export const DIFF_COMPRESSOR = 'deflate-9'

export type DecodeRoute = 'client' | 'server'

export interface DecodeMetrics {
  route: DecodeRoute
  durationMs: number
  /** Set when client decode failed first; the server route succeeded. */
  clientError?: string
}

export async function decodeWithFallback(
  source: DecodeSource,
  key: string,
): Promise<{ pack: Pack; metrics: DecodeMetrics }> {
  const start = performance.now()

  try {
    const pack = await decode(source, {
      ...(key ? { key } : {}),
      compressor: DIFF_COMPRESSOR,
      decompress: smartDecompress,
    })
    const durationMs = Math.round(performance.now() - start)

    return { pack, metrics: { route: 'client', durationMs } }
  } catch (clientErr) {
    const clientMessage = clientErr instanceof Error ? clientErr.message : String(clientErr)

    try {
      const serverStart = performance.now()
      const pack = await serverDecode(source, key)
      const durationMs = Math.round(performance.now() - serverStart)

      return {
        pack,
        metrics: { route: 'server', durationMs, clientError: clientMessage },
      }
    } catch (serverErr) {
      const sMsg = serverErr instanceof Error ? serverErr.message : String(serverErr)

      throw new Error(`client: ${clientMessage}\nserver: ${sMsg}`)
    }
  }
}

/** Same as `decodeWithFallback` but accepts raw bytes (e.g. from server-encode). */
export async function decodeBytesWithFallback(
  bytes: Uint8Array,
  key = '',
): Promise<{ pack: Pack; metrics: DecodeMetrics }> {
  const blob = new Blob([bytes as BlobPart], { type: mimeForBytes(bytes) })

  return decodeWithFallback(blob, key)
}

async function serverDecode(source: DecodeSource, key: string): Promise<Pack> {
  const blob = await sourceToBlob(source)
  const blobBytes = new Uint8Array(await blob.slice(0, 32).arrayBuffer())
  const filename = filenameFor(source, blobBytes)
  const mimeType = blob.type || mimeForBytes(blobBytes)
  const form = new FormData()

  form.append('token', new File([blob], filename, { type: mimeType }))
  if (key) form.append('key', key)

  const res = await fetch('/api/decode', { method: 'POST', body: form })
  const data = (await res.json()) as { bytes?: string; error?: string }

  if (!res.ok || !data.bytes) throw new Error(data.error ?? 'server decode failed')

  const payload = base64ToBytes(data.bytes)

  return fromBytes(payload, {
    decompress: smartDecompress,
    diffTo: feFriendlyDiffTo,
  })
}

async function feFriendlyDiffTo(a: DirPack, b: DirPack): Promise<EncodeResult> {
  const prevEntries = await a.extractAll()
  const nextEntries = await b.extractAll()
  const diffBytes = await encodeDiff(prevEntries, nextEntries, async bytes => {
    const r = await compressRaw(bytes, DIFF_COMPRESSOR)

    return {
      bytes: r.bytes,
      compressor: r.compressor,
      level: r.level,
      originalSize: r.originalSize,
    }
  })

  return browserEncode(diffBytes, { algo: 'linear-none' })
}

async function sourceToBlob(source: DecodeSource): Promise<Blob> {
  if (source instanceof Blob) return source
  if (typeof source === 'string') {
    const res = await fetch(source)

    if (!res.ok) throw new Error(`fetch ${source}: ${res.status}`)

    return await res.blob()
  }
  if (source instanceof Uint8Array) {
    return new Blob([source as BlobPart], { type: mimeForBytes(source) })
  }
  if (source instanceof ArrayBuffer) {
    return new Blob([source], { type: mimeForBytes(new Uint8Array(source)) })
  }
  throw new Error('cannot send HTMLImageElement / ImageBitmap to server decode')
}

function filenameFor(source: DecodeSource, headBytes: Uint8Array): string {
  if (source instanceof File) return source.name
  if (typeof source === 'string') {
    const tail = source.split('/').pop() ?? 'token'

    if (tail.includes('.')) return tail
  }

  return `token${extensionForBytes(headBytes)}`
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  return bytes
}
