import { rsDecode, rsEncode } from './rs'
import { AbstractFec, FecDecodeError, type FecMode, type FecResult } from './types'

export interface ReedSolomonFecInit {
  id: FecMode
  label: string
  headerLevel: number
  parityBytes: number
}

export class ReedSolomonFec extends AbstractFec {
  readonly id: FecMode
  readonly label: string
  readonly headerLevel: number
  readonly parityBytes: number
  readonly overheadPct: number
  readonly recoverableBytesPerBlock: number

  constructor(init: ReedSolomonFecInit) {
    super()
    this.id = init.id
    this.label = init.label
    this.headerLevel = init.headerLevel
    this.parityBytes = init.parityBytes
    this.overheadPct = Math.round((init.parityBytes / (255 - init.parityBytes)) * 1000) / 10
    this.recoverableBytesPerBlock = Math.floor(init.parityBytes / 2)
  }

  encode(input: Buffer): FecResult {
    return {
      data: rsEncode(input, this.parityBytes),
      level: this.headerLevel,
      originalLength: input.length,
    }
  }

  decode(input: Buffer, originalLength: number): Buffer {
    try {
      return rsDecode(input, this.parityBytes, originalLength)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)

      throw new FecDecodeError(`FEC could not recover token (${this.id}): ${msg}`)
    }
  }
}
