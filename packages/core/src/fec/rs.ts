// Reed-Solomon RS(n, k) over GF(2^8) with n = 255.
// Encode appends `nsym = n - k` parity bytes; decode corrects up to floor(nsym/2) byte errors per block.
//
// Algorithm follows the wikiversity reference:
//   encode: synthetic polynomial division by the generator polynomial
//   decode: syndromes → Berlekamp-Massey → Chien search → Forney algorithm
//
// Hand-ported (no external library) so the bundle stays small and the math is auditable.

import { GF_EXP, gfDiv, gfInverse, gfMul, gfPolyAdd, gfPolyEval, gfPolyMul } from './gf256'

const BLOCK_SIZE = 255

function rsGeneratorPoly(nsym: number): Uint8Array {
  let g: Uint8Array = new Uint8Array([1])

  for (let i = 0; i < nsym; i++) {
    g = gfPolyMul(g, new Uint8Array([1, GF_EXP[i]]))
  }

  return g
}

function rsEncodeBlock(msg: Uint8Array, nsym: number): Uint8Array {
  const gen = rsGeneratorPoly(nsym)
  const out = new Uint8Array(msg.length + nsym)

  out.set(msg)
  for (let i = 0; i < msg.length; i++) {
    const coef = out[i]

    if (coef !== 0) {
      for (let j = 1; j < gen.length; j++) {
        out[i + j] ^= gfMul(gen[j], coef)
      }
    }
  }
  out.set(msg)

  return out
}

function rsCalcSyndromes(msg: Uint8Array, nsym: number): Uint8Array {
  const synd = new Uint8Array(nsym + 1)

  for (let i = 0; i < nsym; i++) {
    synd[i + 1] = gfPolyEval(msg, GF_EXP[i])
  }

  return synd
}

function polyScale(p: Uint8Array, x: number): Uint8Array {
  const r = new Uint8Array(p.length)

  for (let i = 0; i < p.length; i++) r[i] = gfMul(p[i], x)

  return r
}

function rsFindErrorLocator(synd: Uint8Array, nsym: number): Uint8Array {
  let errLoc: Uint8Array = new Uint8Array([1])
  let oldLoc: Uint8Array = new Uint8Array([1])
  const syndShift = synd.length - nsym

  for (let i = 0; i < nsym; i++) {
    const k = i + syndShift
    let delta = synd[k]

    for (let j = 1; j < errLoc.length; j++) {
      delta ^= gfMul(errLoc[errLoc.length - j - 1], synd[k - j])
    }
    const shifted = new Uint8Array(oldLoc.length + 1)

    shifted.set(oldLoc, 0)
    oldLoc = shifted
    if (delta !== 0) {
      if (oldLoc.length > errLoc.length) {
        const newLoc = polyScale(oldLoc, delta)

        oldLoc = polyScale(errLoc, gfInverse(delta))
        errLoc = newLoc
      }
      errLoc = gfPolyAdd(errLoc, polyScale(oldLoc, delta))
    }
  }
  let start = 0

  while (start < errLoc.length && errLoc[start] === 0) start++
  errLoc = errLoc.slice(start)
  const errs = errLoc.length - 1

  if (errs * 2 > nsym) throw new Error('rs: too many errors to correct')

  return errLoc
}

function rsFindErrors(errLoc: Uint8Array, msgLen: number): number[] {
  const errs = errLoc.length - 1
  const errPos: number[] = []

  for (let i = 0; i < msgLen; i++) {
    if (gfPolyEval(errLoc, GF_EXP[(255 - i) % 255]) === 0) {
      errPos.push(msgLen - 1 - i)
    }
  }
  if (errPos.length !== errs) throw new Error('rs: error locator did not yield enough roots')

  return errPos
}

function polyReverse(p: Uint8Array): Uint8Array {
  const r = new Uint8Array(p.length)

  for (let i = 0; i < p.length; i++) r[i] = p[p.length - 1 - i]

  return r
}

function gfPolyDiv(dividend: Uint8Array, divisor: Uint8Array): [Uint8Array, Uint8Array] {
  const out = new Uint8Array(dividend)

  for (let i = 0; i < dividend.length - divisor.length + 1; i++) {
    const coef = out[i]

    if (coef !== 0) {
      for (let j = 1; j < divisor.length; j++) {
        if (divisor[j] !== 0) out[i + j] ^= gfMul(divisor[j], coef)
      }
    }
  }
  const sep = out.length - (divisor.length - 1)

  return [out.slice(0, sep), out.slice(sep)]
}

// Ω(x) = (S(x) Λ(x)) mod x^(nsym+1) — input polynomials are high-degree-first
function rsFindErrorEvaluator(syndRev: Uint8Array, errLoc: Uint8Array, nsym: number): Uint8Array {
  const product = gfPolyMul(syndRev, errLoc)
  const divisor = new Uint8Array(nsym + 2)

  divisor[0] = 1
  const [, remainder] = gfPolyDiv(product, divisor)

  return remainder
}

// Forney algorithm — corrects errors in-place. Returns the corrected message.
function rsCorrectErrata(msg: Uint8Array, synd: Uint8Array, errPos: number[]): Uint8Array {
  const coefPos = errPos.map(p => msg.length - 1 - p)
  const X = coefPos.map(p => GF_EXP[p % 255])

  // Build error locator Λ(x) = ∏ (X_i * x + 1)  (in GF(2): 1 - x = 1 + x)
  let errLoc: Uint8Array = new Uint8Array([1])

  for (const xi of X) {
    errLoc = gfPolyMul(errLoc, new Uint8Array([xi, 1]))
  }

  const syndRev = polyReverse(synd)
  // wikiversity computes err_eval and then double-reverses (once on store, once before eval),
  // which cancels — so evaluate the raw output as-is.
  const errEval = rsFindErrorEvaluator(syndRev, errLoc, errLoc.length - 1)

  for (let i = 0; i < X.length; i++) {
    const Xi = X[i]
    const XiInv = gfInverse(Xi)

    // Λ'(X_i^-1) via the formal-derivative product trick:
    //   Λ'(X_i^-1) = ∏_{j ≠ i} (1 - X_j * X_i^-1)
    let errLocPrime = 1

    for (let j = 0; j < X.length; j++) {
      if (j !== i) {
        errLocPrime = gfMul(errLocPrime, 1 ^ gfMul(XiInv, X[j]))
      }
    }
    if (errLocPrime === 0) throw new Error('rs: Forney denominator is zero')

    let y = gfPolyEval(errEval, XiInv)

    y = gfMul(Xi, y)
    const magnitude = gfDiv(y, errLocPrime)

    msg[errPos[i]] ^= magnitude
  }

  return msg
}

function rsDecodeBlock(received: Uint8Array, nsym: number): Uint8Array {
  const synd = rsCalcSyndromes(received, nsym)
  let allZero = true

  for (let i = 1; i < synd.length; i++) {
    if (synd[i] !== 0) {
      allZero = false
      break
    }
  }
  if (allZero) return received.slice(0, received.length - nsym)

  const errLoc = rsFindErrorLocator(synd, nsym)
  const errPos = rsFindErrors(errLoc, received.length)
  const corrected = rsCorrectErrata(new Uint8Array(received), synd, errPos)

  const syndAfter = rsCalcSyndromes(corrected, nsym)

  for (let i = 1; i < syndAfter.length; i++) {
    if (syndAfter[i] !== 0) throw new Error('rs: correction failed (residual syndrome)')
  }

  return corrected.slice(0, corrected.length - nsym)
}

// ── Public block-stream API ───────────────────────────────────────────────

export function rsEncode(input: Buffer, parityBytes: number): Buffer {
  if (parityBytes <= 0 || parityBytes >= BLOCK_SIZE) {
    throw new Error(`rs: parityBytes must be 1..${BLOCK_SIZE - 1}, got ${parityBytes}`)
  }
  const dataPerBlock = BLOCK_SIZE - parityBytes
  const blockCount = Math.ceil(input.length / dataPerBlock) || 1
  const out = Buffer.alloc(blockCount * BLOCK_SIZE)

  for (let i = 0; i < blockCount; i++) {
    const srcStart = i * dataPerBlock
    const srcEnd = Math.min(srcStart + dataPerBlock, input.length)
    const block = new Uint8Array(dataPerBlock)

    for (let j = srcStart; j < srcEnd; j++) block[j - srcStart] = input[j]
    const codeword = rsEncodeBlock(block, parityBytes)

    for (let j = 0; j < BLOCK_SIZE; j++) out[i * BLOCK_SIZE + j] = codeword[j]
  }

  return out
}

export function rsDecode(input: Buffer, parityBytes: number, originalLength: number): Buffer {
  if (parityBytes <= 0 || parityBytes >= BLOCK_SIZE) {
    throw new Error(`rs: parityBytes must be 1..${BLOCK_SIZE - 1}, got ${parityBytes}`)
  }
  if (input.length % BLOCK_SIZE !== 0) {
    throw new Error(`rs: input length ${input.length} is not a multiple of ${BLOCK_SIZE}`)
  }
  const dataPerBlock = BLOCK_SIZE - parityBytes
  const blockCount = input.length / BLOCK_SIZE
  const out = Buffer.alloc(blockCount * dataPerBlock)

  for (let i = 0; i < blockCount; i++) {
    const block = new Uint8Array(input.subarray(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE))
    const decoded = rsDecodeBlock(block, parityBytes)

    for (let j = 0; j < dataPerBlock; j++) out[i * dataPerBlock + j] = decoded[j]
  }

  return out.subarray(0, originalLength) as Buffer
}
