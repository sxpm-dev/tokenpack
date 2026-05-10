import { TokenBase } from 'tokenpack/token/base'

import type { DecodeOptions, DecodeSource } from './decode'
import { decodeSourceToPack, detectSourceAlgorithmName } from './decode-core'

export class Token extends TokenBase<DecodeSource, DecodeOptions> {
  constructor(source: DecodeSource, options: DecodeOptions = {}) {
    super(source, options)
  }

  protected decodeSourceToPack = decodeSourceToPack
  protected detectSourceAlgorithmName = detectSourceAlgorithmName

  protected createToken(source: DecodeSource, options: DecodeOptions): Token {
    return new Token(source, options)
  }
}

export async function applyDiff(
  source: DecodeSource,
  diffToken: DecodeSource,
  options: DecodeOptions = {},
): ReturnType<Token['applyDiff']> {
  return new Token(source, options).applyDiff(diffToken)
}
