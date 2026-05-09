import { enumOption, type OptionsSchema } from '../components/options'

import { rsDecode, rsEncode } from './rs'
import { AbstractFec, FecDecodeError, type FecMode, type FecResult } from './types'

export interface ReedSolomonFecInit {
  id: FecMode
  label: string
  headerLevel: number
  parityBytes: number
}

interface ParityInfo {
  id: FecMode
  label: string
  headerLevel: number
  parityBytes: number
}

const PARITY_TABLE: Record<number, ParityInfo> = {
  5: { id: 'rs-5', label: 'Reed-Solomon · light', headerLevel: 1, parityBytes: 12 },
  15: { id: 'rs-15', label: 'Reed-Solomon · medium', headerLevel: 2, parityBytes: 38 },
  25: { id: 'rs-25', label: 'Reed-Solomon · heavy', headerLevel: 3, parityBytes: 64 },
}

export class ReedSolomonFec extends AbstractFec {
  static override readonly optionsSchema: OptionsSchema = {
    parity: enumOption([5, 15, 25], 15, {
      label: 'Parity bytes',
      description: 'Higher = more recoverable corruption, larger overhead.',
    }),
  }

  static fromOptions(opts: { parity?: number } = {}): ReedSolomonFec {
    const parity = opts.parity ?? 15
    const info = PARITY_TABLE[parity]

    if (!info) throw new Error(`unknown parity: ${parity}`)

    return new ReedSolomonFec(info)
  }

  /** All known parity levels — used by registry to enumerate instances. */
  static enumerate(): ReedSolomonFec[] {
    return Object.values(PARITY_TABLE).map(info => new ReedSolomonFec(info))
  }

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
