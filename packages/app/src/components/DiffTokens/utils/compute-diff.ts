// Diff-pack construction without a browser canvas roundtrip.
//
// Why: `dirPack.diffTo()` from @tokenpack/browser wraps the raw diff bytes in a
// PNG via canvas.toBlob, then we'd re-decode that PNG via createImageBitmap to
// rebuild a DiffPack. For small inputs the browser produces a compact-header
// token, and some browsers shift one pixel byte during the canvas round-trip,
// turning the compact-header `dataLength` into a 16-million-byte value. The
// downstream `linear.decode(buf, dataLength)` then throws
// `"length" is outside of buffer bounds`.
//
// The fix is to build the DiffPack from the raw diff bytes via `fromBytes` (no
// image pipeline at all) and ask the server to wrap the same bytes for the
// downloadable PNG separately. Node's pngjs surface preserves pixel bytes
// deterministically.

import type { DiffPack, DirPack } from '@tokenpack/browser'
import { compressRaw } from 'tokenpack/compressors'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import { encodeDiff } from 'tokenpack/pack-format/encode-diff'

import { smartDecompress } from '@/components/Explorer/utils/smart-decompress'

/** Compressor used for diff regions. FE-friendly so this works in any browser. */
const DIFF_COMPRESSOR = 'deflate-9'

export interface ComputedDiff {
  diffPack: DiffPack
  /** Raw pack-format diff bytes (no image wrapper). */
  diffBytes: Uint8Array
}

/**
 * Compute the diff between two DirPacks and return the in-memory DiffPack
 * directly from the raw diff bytes (no canvas roundtrip).
 */
export async function computeDiff(basePack: DirPack, nextPack: DirPack): Promise<ComputedDiff> {
  const prevEntries = await basePack.extractAll()
  const nextEntries = await nextPack.extractAll()

  const diffBytes = await encodeDiff(prevEntries, nextEntries, async bytes => {
    const r = await compressRaw(bytes, DIFF_COMPRESSOR)

    return {
      bytes: r.bytes,
      compressor: r.compressor,
      level: r.level,
      originalSize: r.originalSize,
    }
  })

  const pack = fromBytes(diffBytes, {
    decompress: smartDecompress,
    diffTo: async () => {
      throw new Error('diffTo on a DiffPack is not supported')
    },
  })

  if (!pack.isDiff()) throw new Error('expected DiffPack from diff bytes')

  return { diffPack: pack, diffBytes }
}

export interface EncodedDiffToken {
  bytes: Uint8Array
  objectURL: string
}

/**
 * Wrap raw diff bytes in a PNG via the server (`/api/encode-bytes`). Used for
 * the downloadable diff token; the in-app DiffPack does NOT depend on this.
 */
export async function encodeDiffTokenViaServer(diffBytes: Uint8Array): Promise<EncodedDiffToken> {
  const form = new FormData()
  const blob = new Blob([diffBytes as BlobPart], { type: 'application/octet-stream' })

  form.append('bytes', new File([blob], 'diff.bin', { type: 'application/octet-stream' }))
  form.append('algo', 'linear')
  form.append('channels', '3')
  form.append('format', 'png')

  const res = await fetch('/api/encode-bytes', { method: 'POST', body: form })
  const data = (await res.json()) as { token?: string; error?: string }

  if (!res.ok || !data.token) throw new Error(data.error ?? 'server diff encode failed')

  const tokenBytes = base64ToBytes(data.token)
  const tokenBlob = new Blob([tokenBytes as BlobPart], { type: 'image/png' })
  const objectURL = URL.createObjectURL(tokenBlob)

  return { bytes: tokenBytes, objectURL }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  return bytes
}
