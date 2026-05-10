import { type FileDiff, type Hunk } from 'tokenpack/diff'
import type { Pack } from 'tokenpack/pack/types'

import type { DecodeOptions, DecodeSource } from './decode'
import { Token } from './token'

export type { FileDiff, Hunk }

export async function diff(
  sourceA: DecodeSource,
  sourceB: DecodeSource,
  options: DecodeOptions = {},
): Promise<Pack> {
  return new Token(sourceA, options).diff(new Token(sourceB, options))
}
