// Forward Error Correction (FEC) entity — adds Reed-Solomon parity bytes so the
// token can survive limited pixel corruption (screenshots, photos, bit-rot).
// Sits as the OUTERMOST layer in the encode pipeline:
//   compress → encrypt → fec.encode → drawer.write
// On decode it runs first, before decrypt+decompress, so it can recover ciphertext.

import type { OptionsSchema } from '../components/options'

export type FecMode = 'none' | 'rs-5' | 'rs-15' | 'rs-25'

export interface FecResult {
  data: Buffer
  level: number
  originalLength: number
}

export class FecDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FecDecodeError'
  }
}

export abstract class AbstractFec {
  /** Tunable options for this FEC scheme. Subclasses override. */
  static readonly optionsSchema: OptionsSchema = {}

  abstract readonly id: FecMode
  abstract readonly label: string
  abstract readonly headerLevel: number
  abstract readonly parityBytes: number
  abstract readonly overheadPct: number
  abstract readonly recoverableBytesPerBlock: number

  abstract encode(input: Buffer): FecResult

  // originalLength is the byte count of the pre-FEC payload (used to strip padding).
  abstract decode(input: Buffer, originalLength: number): Buffer
}
