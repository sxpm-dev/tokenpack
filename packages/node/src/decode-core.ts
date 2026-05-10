import type { AbstractAlgorithm } from 'tokenpack/algorithms/types'
import { decompressRaw } from 'tokenpack/compressors'
import { fromBytes } from 'tokenpack/pack/from-bytes'
import type { Pack } from 'tokenpack/pack/types'

import { nodeAlgorithmCatalog as algorithmCatalog } from './algorithms/catalog'
import { buildDiffToFn } from './build-diff-to'
import type { DecodeOptions, DecodeSource } from './decode'
import { loadSource } from './source-loader'

export async function decodeSourceToPack(
  source: DecodeSource,
  options: DecodeOptions = {},
): Promise<Pack> {
  const { bytes, ext } = await loadSource(source)
  const Ctor = await algorithmCatalog.detectFromBuffer(bytes, ext)
  const algo = new Ctor({ key: options.key })
  const payload = await algo.decode(bytes, { key: options.key, ext })
  const payloadBytes = new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)

  return payloadToPack(payloadBytes, algo)
}

export async function detectSourceAlgorithmName(source: DecodeSource): Promise<string> {
  const { bytes, ext } = await loadSource(source)
  const Ctor = await algorithmCatalog.detectFromBuffer(bytes, ext)

  return Ctor.name
}

export function payloadToPack(bytes: Uint8Array, algo: AbstractAlgorithm): Pack {
  return fromBytes(bytes, {
    decompress: decompressRaw,
    diffTo: buildDiffToFn(algo),
  })
}
