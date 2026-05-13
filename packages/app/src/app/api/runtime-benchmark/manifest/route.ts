import {
  jsonNoCache,
  listRuntimeContentCases,
  listRuntimeRangePackCases,
  listRuntimeRouterCases,
  listRuntimeScriptCases,
  readRuntimeManifest,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const runtimeManifest = readRuntimeManifest()

  if (!runtimeManifest) {
    return jsonNoCache({
      sources: [],
      rangePackCases: [],
      routerCases: [],
      scriptCases: [],
      scenarios: [],
      runtimeFixtures: {
        available: false,
        count: 0,
        entries: [],
        hint: 'Run `yarn benchmark` to generate unified benchmark fixtures and results.',
      },
    })
  }

  return jsonNoCache({
    sources: listRuntimeContentCases(runtimeManifest),
    rangePackCases: listRuntimeRangePackCases(runtimeManifest),
    routerCases: listRuntimeRouterCases(runtimeManifest),
    scriptCases: listRuntimeScriptCases(runtimeManifest),
    scenarios: runtimeManifest.algorithms.flatMap(algo =>
      algo.channels.map(ch => ({
        id: `${algo.name}-c${ch}`,
        algo: algo.name,
        channels: ch,
        group: algo.group,
        streamable: algo.streamable,
        available: runtimeManifest.fixtures.some(
          fixture =>
            fixture.kind === 'token' &&
            fixture.tab === 'content' &&
            fixture.algo === algo.name &&
            fixture.channels === ch,
        ),
      })),
    ),
    runtimeFixtures: {
      available: true,
      count: runtimeManifest.fixtures.length,
      generatedAt: runtimeManifest.generatedAt,
      chunkCounts: runtimeManifest.chunkCounts,
      encodings: runtimeManifest.encodings,
      algorithms: runtimeManifest.algorithms,
      entries: runtimeManifest.fixtures,
      hint: null,
    },
  })
}
