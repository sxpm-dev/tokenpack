// GF(2^8) finite-field arithmetic. Primitive polynomial 0x11d (standard for QR / Reed-Solomon).
// Tables are computed once at module load.

const PRIMITIVE = 0x11d

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)

;(() => {
  let x = 1

  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x = x << 1
    if (x & 0x100) x ^= PRIMITIVE
  }
  // duplicate so EXP[a + b] works without modulo in the hot path
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

export function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0

  return EXP[LOG[a] + LOG[b]]
}

export function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error('div by zero in GF(2^8)')
  if (a === 0) return 0

  return EXP[(LOG[a] + 255 - LOG[b]) % 255]
}

export function gfPow(x: number, power: number): number {
  if (x === 0) return 0
  let p = (LOG[x] * power) % 255

  if (p < 0) p += 255

  return EXP[p]
}

export function gfInverse(x: number): number {
  return EXP[255 - LOG[x]]
}

export function gfPolyAdd(p: Uint8Array, q: Uint8Array): Uint8Array {
  const r = new Uint8Array(Math.max(p.length, q.length))

  for (let i = 0; i < p.length; i++) r[i + r.length - p.length] = p[i]
  for (let i = 0; i < q.length; i++) r[i + r.length - q.length] ^= q[i]

  return r
}

export function gfPolyMul(p: Uint8Array, q: Uint8Array): Uint8Array {
  const r = new Uint8Array(p.length + q.length - 1)

  for (let i = 0; i < p.length; i++) {
    for (let j = 0; j < q.length; j++) {
      r[i + j] ^= gfMul(p[i], q[j])
    }
  }

  return r
}

export function gfPolyScale(p: Uint8Array, x: number): Uint8Array {
  const r = new Uint8Array(p.length)

  for (let i = 0; i < p.length; i++) r[i] = gfMul(p[i], x)

  return r
}

export function gfPolyEval(p: Uint8Array, x: number): number {
  let y = p[0]

  for (let i = 1; i < p.length; i++) {
    y = gfMul(y, x) ^ p[i]
  }

  return y
}

export { EXP as GF_EXP, LOG as GF_LOG }
