import { decompressRaw } from 'tokenpack/compressors'
import type { DecompressFn, DecompressMeta } from 'tokenpack/pack-format/decompress'

import { isStaticSite } from '@/lib/site-path'

/**
 * FE-first / server-fallback decompressor. Tries the env-registered browser
 * decompressor first; if it throws (e.g. older browsers without
 * `DecompressionStream('br')`), POSTs to `/api/decompress` for a Node-zlib
 * fallback.
 */
export const smartDecompress: DecompressFn = async (bytes, compressor, meta) => {
  try {
    return await decompressRaw(bytes, compressor, meta)
  } catch (clientErr) {
    if (isStaticSite)
      throw new Error(
        `This browser cannot decode this file. Try a deflate example or run locally for the server fallback. ${clientErr instanceof Error ? clientErr.message : String(clientErr)}`,
      )
    try {
      return await serverDecompress(bytes, compressor, meta)
    } catch (serverErr) {
      const cMsg = clientErr instanceof Error ? clientErr.message : String(clientErr)
      const sMsg = serverErr instanceof Error ? serverErr.message : String(serverErr)

      throw new Error(`decompress failed — client: ${cMsg}; server: ${sMsg}`)
    }
  }
}

async function serverDecompress(
  bytes: Uint8Array,
  compressor: string,
  meta: DecompressMeta,
): Promise<Uint8Array> {
  const form = new FormData()
  const blob = new Blob([bytes as BlobPart], { type: 'application/octet-stream' })

  form.append('bytes', new File([blob], 'region.bin', { type: 'application/octet-stream' }))
  form.append('compressor', compressor)
  form.append('level', String(meta.level))
  form.append('uncompressedLength', String(meta.uncompressedLength))

  const res = await fetch('/api/decompress', { method: 'POST', body: form })
  const data = (await res.json()) as { bytes?: string; error?: string }

  if (!res.ok || !data.bytes) throw new Error(data.error ?? 'server decompress failed')

  return base64ToBytes(data.bytes)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const out = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)

  return out
}
