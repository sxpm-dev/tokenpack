import '@tokenpack/node'

import fs from 'fs'
import path from 'path'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'

import { jsonNoCache, SOURCE_FILES, sourcePathFor } from '../_shared'

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

interface ScenarioInfo {
  id: string
  available: boolean
  mime: string | null
}

function listScenarios(firstSource: string | null): ScenarioInfo[] {
  const out: ScenarioInfo[] = []

  for (const Ctor of algorithmCatalog.list()) {
    const surface = new (Ctor.Surface as unknown as new () => {
      extension: string
      mimeType: string
    })()

    for (const ch of Ctor.capabilities.channels) {
      const id = `${Ctor.name}-c${ch}`
      const fixture = firstSource
        ? path.join(RUNTIME_FIXTURES, `${firstSource}.${id}${surface.extension}`)
        : null
      const available = fixture ? fs.existsSync(fixture) : false

      out.push({ id, available, mime: available ? surface.mimeType : null })
    }
  }

  return out
}

export async function GET() {
  const sources = Object.keys(SOURCE_FILES)
    .map(id => {
      const info = sourcePathFor(id)

      return info ? { id, file: SOURCE_FILES[id], rawBytes: info.size } : null
    })
    .filter((s): s is { id: string; file: string; rawBytes: number } => s !== null)

  const scenarios = listScenarios(sources[0]?.id ?? null)
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
        : 'Run `yarn benchmark:generate:runtime` to pre-generate compressed text fixtures.',
    },
  })
}
