import fs from 'fs'
import path from 'path'

import { jsonNoCache, SCENARIOS, SOURCE_FILES, sourcePathFor, tokenPathFor } from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RUNTIME_FIXTURES = path.join(process.cwd(), 'runtime-fixtures')

interface RuntimeFixtureEntry {
  source: string
  encoding: string
  file: string
  bytes: number
  originalBytes: number
  encodeMs: number
}

function readRuntimeFixtures(): RuntimeFixtureEntry[] | null {
  const manifestPath = path.join(RUNTIME_FIXTURES, 'manifest.json')

  if (!fs.existsSync(manifestPath)) return null
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as RuntimeFixtureEntry[]
  } catch {
    return null
  }
}

export async function GET() {
  const sources = Object.keys(SOURCE_FILES)
    .map(id => {
      const info = sourcePathFor(id)

      return info ? { id, file: SOURCE_FILES[id], rawBytes: info.size } : null
    })
    .filter((s): s is { id: string; file: string; rawBytes: number } => s !== null)

  const scenarios = SCENARIOS.map(id => {
    const sample = sources[0] ? tokenPathFor(sources[0].id, id) : null

    return { id, available: !!sample, mime: sample?.mime ?? null }
  })

  const runtimeFixtures = readRuntimeFixtures()

  return jsonNoCache({
    sources,
    scenarios,
    runtimeFixtures: {
      available: runtimeFixtures !== null,
      count: runtimeFixtures?.length ?? 0,
      entries: runtimeFixtures ?? [],
      hint: runtimeFixtures
        ? null
        : 'Run `yarn benchmark:generate:runtime` to pre-generate compressed text fixtures (used by /text endpoint when ?live=1 is omitted).',
    },
  })
}
