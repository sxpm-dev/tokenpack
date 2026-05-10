import { Buffer } from 'buffer'
import type { AbstractAlgorithm } from 'tokenpack/algorithms/types'
import type { DirPack } from 'tokenpack/pack/types'

import type { EncodeResult } from './encode'

export function buildDiffToFn(algo: AbstractAlgorithm) {
  return async (a: DirPack, b: DirPack): Promise<EncodeResult> => {
    const tokenBytes = await algo.diff(a, b).token()
    const buf = Buffer.from(tokenBytes.buffer, tokenBytes.byteOffset, tokenBytes.byteLength)

    return Object.assign(buf, { bytes: tokenBytes })
  }
}
