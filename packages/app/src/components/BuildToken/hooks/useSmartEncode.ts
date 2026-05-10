'use client'

import { encode } from '@tokenpack/browser'
import { browserAlgorithmCatalog } from '@tokenpack/browser/algorithms/catalog'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { EncodeConfig } from '@/components/EncodeForm'

import type { BuilderEntry, BuildResult } from '../types'
import { buildEncodeOptions, resolveAlgoName } from '../utils/encode-options'
import { entriesToBuilder } from '../utils/entries-to-builder'
import { checkFEEligibility } from '../utils/fe-eligibility'
import { base64ToBytes, serverEncodePack } from '../utils/server-encode'

export interface UseSmartEncodeApi {
  result: BuildResult | null
  loading: boolean
  error: string | null
  run: (entries: ReadonlyArray<BuilderEntry>, config: EncodeConfig) => Promise<BuildResult | null>
  reset: () => void
}

export function useSmartEncode(): UseSmartEncodeApi {
  const [result, setResult] = useState<BuildResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previousURL = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (previousURL.current) URL.revokeObjectURL(previousURL.current)
    },
    [],
  )

  const run = useCallback(
    async (
      entries: ReadonlyArray<BuilderEntry>,
      config: EncodeConfig,
    ): Promise<BuildResult | null> => {
      setLoading(true)
      setError(null)

      try {
        const eligibility = checkFEEligibility(config)
        const inputBytes = await sumInputBytes(entries)
        const surface = surfaceMeta(resolveAlgoName(config))
        const fileName = `pack${surface.extension}`
        const next = eligibility.ok
          ? await runFE(entries, config, fileName, surface.mime, inputBytes)
          : await runBE(entries, config, inputBytes)

        if (previousURL.current) URL.revokeObjectURL(previousURL.current)
        previousURL.current = next.objectURL

        setResult(next)

        return next
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
        setResult(null)

        return null
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    if (previousURL.current) URL.revokeObjectURL(previousURL.current)
    previousURL.current = null
    setResult(null)
    setError(null)
  }, [])

  return { result, loading, error, run, reset }
}

async function runFE(
  entries: ReadonlyArray<BuilderEntry>,
  config: EncodeConfig,
  fileName: string,
  mime: string,
  inputBytes: number,
): Promise<BuildResult> {
  const builder = await entriesToBuilder(entries)
  const options = buildEncodeOptions(config)
  const encoded = await encode(builder, options)
  const objectURL =
    encoded.objectURL ?? URL.createObjectURL(new Blob([encoded.bytes as BlobPart], { type: mime }))

  return {
    bytes: encoded.bytes,
    objectURL,
    fileName,
    fromServer: false,
    inputBytes,
    gzipBytes: null,
    brotliBytes: null,
  }
}

async function runBE(
  entries: ReadonlyArray<BuilderEntry>,
  config: EncodeConfig,
  inputBytes: number,
): Promise<BuildResult> {
  const data = await serverEncodePack(entries, config)
  const bytes = base64ToBytes(data.token)
  const blob = new Blob([bytes as BlobPart], { type: data.mime })
  const objectURL = URL.createObjectURL(blob)

  return {
    bytes,
    objectURL,
    fileName: data.fileName,
    fromServer: true,
    inputBytes,
    gzipBytes: data.gzipSize,
    brotliBytes: data.brotliSize,
  }
}

async function sumInputBytes(entries: ReadonlyArray<BuilderEntry>): Promise<number> {
  let total = 0

  for (const entry of entries) {
    if (entry.kind === 'text') total += new TextEncoder().encode(entry.text).length
    else total += entry.file.size
  }

  return total
}

function surfaceMeta(algoName: string): { extension: string; mime: string } {
  try {
    const Ctor = browserAlgorithmCatalog.getByName(algoName)
    const surface = new (Ctor.Surface as unknown as new () => {
      extension: string
      mimeType: string
    })()

    return { extension: surface.extension, mime: surface.mimeType }
  } catch {
    return { extension: '.png', mime: 'image/png' }
  }
}
