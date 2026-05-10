import { PackTokenBase, TokenBase } from 'tokenpack/token/base'

import type { DecodeOptions, DecodeSource } from './decode'
import { decodeSourceToPack, detectSourceAlgorithmName } from './decode-core'
import { decodeStream, type DecodeStreamSource } from './decode-stream'

export class Token extends TokenBase<DecodeSource, DecodeOptions> {
  constructor(source: DecodeSource, options: DecodeOptions = {}) {
    super(source, options)
  }

  protected decodeSourceToPack = decodeSourceToPack
  protected detectSourceAlgorithmName = detectSourceAlgorithmName

  protected createToken(source: DecodeSource, options: DecodeOptions): Token {
    return new Token(source, options)
  }

  stream(source: DecodeStreamSource = this.source as DecodeStreamSource): TokenStream {
    return new TokenStream(source, this.options)
  }
}

export class TokenStream extends PackTokenBase<DecodeStreamSource, DecodeOptions> {
  constructor(source: DecodeStreamSource, options: DecodeOptions = {}) {
    super(source, options)
  }

  protected decodeSourceToPack = decodeStream
}

export async function applyDiff(
  source: DecodeSource,
  diffToken: DecodeSource,
  options: DecodeOptions = {},
): ReturnType<Token['applyDiff']> {
  return new Token(source, options).applyDiff(diffToken)
}
