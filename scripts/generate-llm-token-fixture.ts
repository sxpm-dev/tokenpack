#!/usr/bin/env tsx

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { decode, encode } from '@tokenpack/node'

const DEFAULT_OUT = path.resolve('tmp/llm-token-fixture')
const DEFAULT_RECORDS = 100
const FIXTURE_NAME = 'big-dataset.json'
const TOKEN_ALGO = 'linear-deflate'

interface Args {
  records: number
  out: string
  help?: boolean
}

interface TargetFilter {
  region: string
  product: string
  tier: string
}

interface ExpectedAnswer {
  filter: TargetFilter
  matchingRecords: number
  totalRevenue: number
  totalRefunds: number
  netRevenue: number
  totalMonthlyActiveUsers: number
}

interface BenchmarkRecord {
  id: string
  month: string
  accountId: string
  region: string
  product: string
  tier: string
  channel: string
  monthlyActiveUsers: number
  conversionRate: number
  refundRate: number
  revenue: number
  refunds: number
  netRevenue: number
  featureFlags: {
    streaming: boolean
    imageToken: boolean
    auditExport: boolean
  }
  notes: string
}

interface Dataset {
  schemaVersion: number
  generatedAt: string
  description: string
  records: BenchmarkRecord[]
  expectedAnswers: {
    apacEnterpriseTokenPackNetRevenue: ExpectedAnswer
  }
}

function usage(): string {
  return `Usage:
  yarn bench:llm-token:fixture
  yarn bench:llm-token:fixture --records 5000 --out ./tmp/my-fixture

Options:
  --records <number>   Number of synthetic event records. Default: ${DEFAULT_RECORDS}
  --out <dir>          Output directory. Default: ${DEFAULT_OUT}
  --help               Show this help.
`
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    records: DEFAULT_RECORDS,
    out: DEFAULT_OUT,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    const next = (): string => {
      const value = argv[++i]
      if (!value) throw new Error(`Missing value for ${arg}`)
      return value
    }

    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--records') args.records = Number(next())
    else if (arg === '--out') args.out = path.resolve(next())
    else throw new Error(`Unknown argument: ${arg}`)
  }

  if (!Number.isInteger(args.records) || args.records < 20) {
    throw new Error('--records must be an integer >= 20')
  }

  return args
}

function seededValue(seed: number): number {
  let value = seed >>> 0
  value ^= value << 13
  value ^= value >>> 17
  value ^= value << 5
  return value >>> 0
}

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length]!
}

function buildDataset(recordCount: number): { dataset: Dataset; expected: ExpectedAnswer } {
  const regions = ['NA', 'EMEA', 'APAC', 'LATAM'] as const
  const products = ['Tracer', 'Runtime Context', 'Docs', 'Telemetry Bridge', 'Token Pack'] as const
  const tiers = ['free', 'team', 'business', 'enterprise'] as const
  const channels = ['direct', 'partner', 'marketplace', 'community'] as const
  const records: BenchmarkRecord[] = []

  const target: TargetFilter = {
    region: 'APAC',
    product: 'Token Pack',
    tier: 'enterprise',
  }

  let targetRevenue = 0
  let targetRefunds = 0
  let targetUsers = 0

  for (let i = 0; i < recordCount; i += 1) {
    const hash = seededValue(i + 42)
    const region = pick(regions, hash)
    const product = pick(products, hash >>> 3)
    const tier = pick(tiers, hash >>> 6)
    const channel = pick(channels, hash >>> 9)
    const monthlyActiveUsers = 20 + (hash % 900)
    const conversionRate = Number(((hash % 1900) / 10000 + 0.03).toFixed(4))
    const refundRate = Number((((hash >>> 11) % 450) / 10000).toFixed(4))
    const tierMultiplier = tier === 'enterprise' ? 620 : tier === 'business' ? 180 : tier === 'team' ? 48 : 9
    const revenue = Number((monthlyActiveUsers * conversionRate * tierMultiplier).toFixed(2))
    const refunds = Number((revenue * refundRate).toFixed(2))

    if (region === target.region && product === target.product && tier === target.tier) {
      targetRevenue += revenue
      targetRefunds += refunds
      targetUsers += monthlyActiveUsers
    }

    records.push({
      id: `evt_${String(i + 1).padStart(5, '0')}`,
      month: `2026-${String((i % 12) + 1).padStart(2, '0')}`,
      accountId: `acct_${String((hash % 530) + 1).padStart(4, '0')}`,
      region,
      product,
      tier,
      channel,
      monthlyActiveUsers,
      conversionRate,
      refundRate,
      revenue,
      refunds,
      netRevenue: Number((revenue - refunds).toFixed(2)),
      featureFlags: {
        streaming: Boolean(hash & 1),
        imageToken: Boolean(hash & 2),
        auditExport: Boolean(hash & 4),
      },
      notes: `Synthetic benchmark row ${i + 1}. Use only for LLM token transport comparison.`,
    })
  }

  const expected: ExpectedAnswer = {
    filter: target,
    matchingRecords: records.filter(
      (record) =>
        record.region === target.region &&
        record.product === target.product &&
        record.tier === target.tier,
    ).length,
    totalRevenue: Number(targetRevenue.toFixed(2)),
    totalRefunds: Number(targetRefunds.toFixed(2)),
    netRevenue: Number((targetRevenue - targetRefunds).toFixed(2)),
    totalMonthlyActiveUsers: targetUsers,
  }

  return {
    dataset: {
      schemaVersion: 1,
      generatedAt: '2026-05-15T00:00:00.000Z',
      description:
        'Large synthetic SaaS event dataset for raw JSON vs image-token LLM benchmarking.',
      records,
      expectedAnswers: {
        apacEnterpriseTokenPackNetRevenue: expected,
      },
    },
    expected,
  }
}

async function verifyToken(tokenBytes: Uint8Array, expectedJson: string): Promise<boolean> {
  const pack = await decode(tokenBytes)
  if (pack.isPack() || pack.isDiff()) return false
  const decodedText = await pack.text()
  return decodedText === expectedJson
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(usage())
    return
  }

  await mkdir(args.out, { recursive: true })

  const { dataset, expected } = buildDataset(args.records)
  const jsonText = `${JSON.stringify(dataset, null, 2)}\n`
  const jsonBuffer = Buffer.from(jsonText, 'utf8')

  const jsonPath = path.join(args.out, FIXTURE_NAME)
  const tokenPath = path.join(args.out, 'big-dataset-token.png')
  const questionPath = path.join(args.out, 'question.txt')
  const expectedPath = path.join(args.out, 'expected-answer.json')
  const readmePath = path.join(args.out, 'README.md')

  const tokenResult = await encode(jsonBuffer, {
    algo: TOKEN_ALGO,
    name: FIXTURE_NAME,
    out: tokenPath,
  })

  const question = [
    'In the provided dataset, filter records where region is APAC, product is Token Pack, and tier is enterprise.',
    'Return the matching record count, total revenue, total refunds, net revenue, and total monthly active users.',
    'Group the answer under the key apacEnterpriseTokenPackNetRevenue.',
  ].join(' ')

  await writeFile(jsonPath, jsonText)
  await writeFile(questionPath, `${question}\n`)
  await writeFile(expectedPath, `${JSON.stringify(expected, null, 2)}\n`)

  const verified = await verifyToken(tokenResult.bytes, jsonText)
  if (!verified) throw new Error('Generated token verification failed')

  const tokenBytesOnDisk = (await readFile(tokenPath)).byteLength

  await writeFile(
    readmePath,
    [
      '# LLM Token Benchmark Fixture',
      '',
      `Records: ${args.records}`,
      `JSON bytes: ${jsonBuffer.byteLength}`,
      `Token PNG bytes: ${tokenBytesOnDisk}`,
      `Encoded with: @tokenpack/node encode() (algo: ${TOKEN_ALGO})`,
      '',
      'Run:',
      '',
      '```bash',
      `yarn bench:llm-token --json ${jsonPath} --token ${tokenPath} --question-file ${questionPath}`,
      '```',
      '',
    ].join('\n'),
  )

  console.log(`Wrote ${jsonPath}`)
  console.log(`Wrote ${tokenPath}`)
  console.log(`Wrote ${questionPath}`)
  console.log(`Wrote ${expectedPath}`)
  console.log(`JSON bytes: ${jsonBuffer.byteLength}`)
  console.log(`Token PNG bytes: ${tokenBytesOnDisk}`)
  console.log(`Expected answer: ${JSON.stringify(expected)}`)
  console.log('Verification: ok')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  console.error('')
  console.error(usage())
  process.exitCode = 1
})
