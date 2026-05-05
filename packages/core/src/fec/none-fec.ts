import { AbstractFec, type FecMode, type FecResult } from './types'

export class NoneFec extends AbstractFec {
  readonly id: FecMode = 'none'
  readonly label = 'None'
  readonly headerLevel = 0
  readonly parityBytes = 0
  readonly overheadPct = 0
  readonly recoverableBytesPerBlock = 0

  encode(input: Buffer): FecResult {
    return { data: input, level: 0, originalLength: input.length }
  }

  decode(input: Buffer, originalLength: number): Buffer {
    return input.subarray(0, originalLength)
  }
}
