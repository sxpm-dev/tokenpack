'use client'

import { diff, type DiffPack, type DirPack, encode } from '@tokenpack/browser'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { BuilderEntry } from '@/components/BuildToken'
import { buildEncodeOptions } from '@/components/BuildToken/utils/encode-options'
import { entriesToBuilder } from '@/components/BuildToken/utils/entries-to-builder'
import { checkFEEligibility } from '@/components/BuildToken/utils/fe-eligibility'
import { base64ToBytes, serverEncodePack } from '@/components/BuildToken/utils/server-encode'
import type { EncodeConfig } from '@/components/EncodeForm'
import { mimeForFormat } from '@/components/EncodeForm'
import { decodeBytesWithFallback } from '@/lib/decode-with-fallback'

export interface GenerateDiffOutput {
  baseBytes: Uint8Array
  baseObjectURL: string
  nextBytes: Uint8Array
  nextObjectURL: string
  diffBytes: Uint8Array
  diffObjectURL: string
  basePack: DirPack
  nextPack: DirPack
  diffPack: DiffPack
  /** True when base/next were encoded server-side (BE-only algo or compressor). */
  fromServer: boolean
}

export interface UseGenerateDiffApi {
  output: GenerateDiffOutput | null
  loading: boolean
  error: string | null
  run: (
    baseEntries: ReadonlyArray<BuilderEntry>,
    nextEntries: ReadonlyArray<BuilderEntry>,
    config: EncodeConfig,
  ) => Promise<void>
  reset: () => void
}

interface EncodedToken {
  bytes: Uint8Array
  objectURL: string
}

export function useGenerateDiff(): UseGenerateDiffApi {
  const [output, setOutput] = useState<GenerateDiffOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previousURLs = useRef<string[]>([])

  useEffect(
    () => () => {
      previousURLs.current.forEach(URL.revokeObjectURL)
    },
    [],
  )

  const run = useCallback(
    async (
      baseEntries: ReadonlyArray<BuilderEntry>,
      nextEntries: ReadonlyArray<BuilderEntry>,
      config: EncodeConfig,
    ) => {
      setLoading(true)
      setError(null)

      try {
        if (baseEntries.length === 0) throw new Error('Base needs at least one entry')
        if (nextEntries.length === 0) throw new Error('Next needs at least one entry')

        const eligibility = checkFEEligibility(config)
        const fromServer = !eligibility.ok

        const baseEncoded = fromServer
          ? await encodeViaServer(baseEntries, config)
          : await encodeViaBrowser(baseEntries, config)
        const nextEncoded = fromServer
          ? await encodeViaServer(nextEntries, config)
          : await encodeViaBrowser(nextEntries, config)

        const { pack: basePack } = await decodeBytesWithFallback(baseEncoded.bytes)
        const { pack: nextPack } = await decodeBytesWithFallback(nextEncoded.bytes)

        if (!basePack.isPack() || !nextPack.isPack()) {
          throw new Error('encoded result was not a DirPack — unexpected')
        }

        // Unified diff path: `diff(a, b).token()` produces a real diff token
        // packaged with the source algorithm, then we decode it back to a
        // DiffPack for in-app rendering. No server hop needed.
        const diffTokenBytes = await diff(baseEncoded.bytes, nextEncoded.bytes).token()
        const { pack: diffPackUnknown } = await decodeBytesWithFallback(diffTokenBytes)

        if (!diffPackUnknown.isDiff()) {
          throw new Error('diff token did not decode to a DiffPack — unexpected')
        }
        const diffPack = diffPackUnknown as DiffPack
        const diffBlob = new Blob([diffTokenBytes as BlobPart], { type: mimeForFormat('png') })
        const diffObjectURL = URL.createObjectURL(diffBlob)

        previousURLs.current.forEach(URL.revokeObjectURL)
        previousURLs.current = [baseEncoded.objectURL, nextEncoded.objectURL, diffObjectURL]

        setOutput({
          baseBytes: baseEncoded.bytes,
          baseObjectURL: baseEncoded.objectURL,
          nextBytes: nextEncoded.bytes,
          nextObjectURL: nextEncoded.objectURL,
          diffBytes: diffTokenBytes,
          diffObjectURL,
          basePack,
          nextPack,
          diffPack,
          fromServer,
        })
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
        setOutput(null)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    previousURLs.current.forEach(URL.revokeObjectURL)
    previousURLs.current = []
    setOutput(null)
    setError(null)
  }, [])

  return { output, loading, error, run, reset }
}

async function encodeViaBrowser(
  entries: ReadonlyArray<BuilderEntry>,
  config: EncodeConfig,
): Promise<EncodedToken> {
  const builder = await entriesToBuilder(entries)
  const opts = buildEncodeOptions(config)
  const result = await encode(builder, opts)

  return { bytes: new Uint8Array(result.bytes), objectURL: result.objectURL }
}

async function encodeViaServer(
  entries: ReadonlyArray<BuilderEntry>,
  config: EncodeConfig,
): Promise<EncodedToken> {
  const data = await serverEncodePack(entries, config)
  const bytes = base64ToBytes(data.token)
  const blob = new Blob([bytes as BlobPart], { type: mimeForFormat('png') })
  const objectURL = URL.createObjectURL(blob)

  return { bytes, objectURL }
}
