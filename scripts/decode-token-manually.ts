#!/usr/bin/env tsx

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import zlib from 'node:zlib'

import sharp from 'sharp'

const DEFAULT_TOKEN = path.resolve('tmp/llm-token-fixture/big-dataset-token.png')

async function main(): Promise<void> {
  const tokenPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_TOKEN
  console.log(`Decoding ${tokenPath}`)

  // Step 1 — PNG → raw RGB pixel grid (alpha dropped).
  const pngBytes = await readFile(tokenPath)
  const { data: rgb, info } = await sharp(pngBytes)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const pixelStream = new Uint8Array(rgb)
  console.log(
    `Step 1: PNG decoded — ${info.width}×${info.height} ${info.channels}ch, ${pixelStream.length} RGB bytes`,
  )

  // Step 2 — already concatenated by sharp (top-to-bottom, R,G,B per pixel). Call it P.
  const P = pixelStream
  const hexHead = Buffer.from(P.subarray(0, 16)).toString('hex')
  console.log(`Step 2: P[0..16] hex = ${hexHead}`)

  // Step 3 — detect header.
  let dataStart: number
  let fileLength: number
  let compressionLevel: number
  let algorithmId: number
  let uncompressedLength = 0
  let dataPixelCount = 0
  let channels = 0
  let headerKind: 'full' | 'compact'

  if (P[0] === 0xc0 && P[1] === 0xde && P[2] === 0xae && P[3] === 0x54) {
    headerKind = 'full'
    algorithmId = P[5]!
    fileLength = ((P[6]! << 24) | (P[7]! << 16) | (P[8]! << 8) | P[9]!) >>> 0
    compressionLevel = P[15]!
    uncompressedLength = ((P[16]! << 24) | (P[17]! << 16) | (P[18]! << 8) | P[19]!) >>> 0
    dataPixelCount = ((P[21]! << 24) | (P[22]! << 16) | (P[23]! << 8) | P[24]!) >>> 0
    channels = P[25]!
    dataStart = 30
  } else if (P[0] === 0xc1) {
    headerKind = 'compact'
    algorithmId = P[1]!
    const flags = P[2]!
    compressionLevel = flags & 0b10 ? 4 : 0
    fileLength = (P[3]! << 16) | (P[4]! << 8) | P[5]!
    dataStart = 6
  } else {
    throw new Error(`Step 3: unrecognized header magic ${hexHead.slice(0, 8)}`)
  }
  console.log(
    `Step 3: ${headerKind} header — algorithmId=${algorithmId}, compressionLevel=${compressionLevel}, fileLength=${fileLength}, uncompressedLength=${uncompressedLength}, dataPixelCount=${dataPixelCount}, channels=${channels}`,
  )

  // Step 4 — slice out the data region D.
  const D = Buffer.from(P.subarray(dataStart, dataStart + fileLength))
  console.log(`Step 4: D = bytes [${dataStart}..${dataStart + fileLength}) = ${D.length} bytes`)
  console.log(`        D[0..16] hex = ${D.subarray(0, 16).toString('hex')}`)

  // Step 5 — map compressionLevel → compressor, decompress.
  const COMPRESSION_MAP: Record<number, { family: 'none' | 'deflate' | 'brotli'; level?: number }> = {
    0: { family: 'none' },
    1: { family: 'deflate', level: 6 },
    2: { family: 'brotli', level: 11 },
    3: { family: 'deflate', level: 1 },
    4: { family: 'deflate', level: 9 },
    5: { family: 'brotli', level: 4 },
    6: { family: 'brotli', level: 6 },
  }
  const codec = COMPRESSION_MAP[compressionLevel]
  if (!codec) throw new Error(`Step 5: unknown compressionLevel ${compressionLevel}`)
  console.log(`Step 5: family=${codec.family}${codec.level !== undefined ? ` level=${codec.level}` : ''}`)
  let W: Buffer
  if (codec.family === 'none') {
    W = D
  } else if (codec.family === 'deflate') {
    // Try zlib-wrapped first, fall back to raw deflate.
    try {
      W = zlib.inflateSync(D)
    } catch {
      W = zlib.inflateRawSync(D)
    }
  } else {
    W = zlib.brotliDecompressSync(D)
  }
  console.log(`Step 5: W decompressed to ${W.length} bytes (expected uncompressedLength=${uncompressedLength})`)

  // Step 6 — parse wrapped-file envelope.
  let payload: Buffer
  let extractedName: string | null = null
  if (
    W.length >= 7 &&
    W[0] === 0xc0 &&
    W[1] === 0xde &&
    W[2] === 0xae &&
    W[3] === 0x54 &&
    W[4] === 0x01
  ) {
    const nameLen = W.readUInt16LE(5)
    extractedName = W.subarray(7, 7 + nameLen).toString('utf8')
    payload = W.subarray(7 + nameLen)
    console.log(`Step 6: envelope found — name="${extractedName}", payload=${payload.length} bytes`)
  } else {
    payload = W
    console.log('Step 6: no envelope signature; treating all of W as payload')
  }

  // Step 7 — parse payload as UTF-8 JSON.
  const text = payload.toString('utf8')
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new Error(`Step 7: payload is not valid JSON: ${(error as Error).message}`)
  }
  const root = parsed as { records?: unknown[]; description?: string; schemaVersion?: number }
  console.log(
    `Step 7: JSON parsed — schemaVersion=${root.schemaVersion}, records=${root.records?.length ?? '?'}, description=${root.description ?? '?'}`,
  )

  // Sanity filter — answer the fixture question end-to-end.
  if (Array.isArray(root.records)) {
    type Row = {
      region?: string
      product?: string
      tier?: string
      revenue?: number
      refunds?: number
      monthlyActiveUsers?: number
    }
    const matches = (root.records as Row[]).filter(
      (r) => r.region === 'APAC' && r.product === 'Token Pack' && r.tier === 'enterprise',
    )
    const totalRevenue = matches.reduce((s, r) => s + (r.revenue ?? 0), 0)
    const totalRefunds = matches.reduce((s, r) => s + (r.refunds ?? 0), 0)
    const totalMau = matches.reduce((s, r) => s + (r.monthlyActiveUsers ?? 0), 0)
    console.log('')
    console.log('Computed answer (using the decoded JSON):')
    console.log(`  matchingRecords:          ${matches.length}`)
    console.log(`  totalRevenue:             ${totalRevenue.toFixed(2)}`)
    console.log(`  totalRefunds:             ${totalRefunds.toFixed(2)}`)
    console.log(`  netRevenue:               ${(totalRevenue - totalRefunds).toFixed(2)}`)
    console.log(`  totalMonthlyActiveUsers:  ${totalMau}`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
