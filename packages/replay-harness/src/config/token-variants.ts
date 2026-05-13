export type ReplayPackLoadMode =
  | 'full'
  | 'stream'
  | 'range-fetch'
  | 'range-stream'
  | 'range-fetch-all'
  | 'range-stream-all'
  | 'range-stream-batch'
  | 'router-materialize'

export interface ReplayTokenVariant {
  id: string
  algo: string
  channels: 3 | 4
  loadMode: ReplayPackLoadMode
  packCompressor: string
}

export interface ReplayTokenVariantLabels {
  family: string
  encoding: string
  runtimePolicy: string
  transferStyle: 'buffered' | 'streaming' | 'mixed'
}

export const DEFAULT_REPLAY_TOKEN_VARIANTS: readonly ReplayTokenVariant[] = [
  {
    id: 'linear-deflate-c3',
    algo: 'linear-deflate',
    channels: 3,
    loadMode: 'full',
    packCompressor: 'deflate-9',
  },
  {
    id: 'linear-stream-deflate-c4',
    algo: 'linear-stream-deflate',
    channels: 4,
    loadMode: 'stream',
    packCompressor: 'deflate-9',
  },
  {
    id: 'pixel-range-stream-deflate-c3',
    algo: 'pixel-range-stream-deflate',
    channels: 3,
    loadMode: 'stream',
    packCompressor: 'deflate-9',
  },
  {
    id: 'pixel-range-none-range-fetch',
    algo: 'pixel-range-none',
    channels: 3,
    loadMode: 'range-fetch',
    packCompressor: 'deflate-9',
  },
  {
    id: 'pixel-range-none-range-stream',
    algo: 'pixel-range-none',
    channels: 3,
    loadMode: 'range-stream',
    packCompressor: 'deflate-9',
  },
  {
    id: 'pixel-range-none-range-fetch-all',
    algo: 'pixel-range-none',
    channels: 3,
    loadMode: 'range-fetch-all',
    packCompressor: 'deflate-9',
  },
  {
    id: 'pixel-range-none-range-stream-all',
    algo: 'pixel-range-none',
    channels: 3,
    loadMode: 'range-stream-all',
    packCompressor: 'deflate-9',
  },
  {
    id: 'pixel-range-none-range-stream-batch',
    algo: 'pixel-range-none',
    channels: 3,
    loadMode: 'range-stream-batch',
    packCompressor: 'deflate-9',
  },
  {
    id: 'router-pixel-range-none-materialize',
    algo: 'pixel-range-none',
    channels: 3,
    loadMode: 'router-materialize',
    packCompressor: 'deflate-9',
  },
]

export function strategyForLoadMode(loadMode: ReplayPackLoadMode): string {
  switch (loadMode) {
    case 'full':
      return 'extract-full-fetch'
    case 'stream':
      return 'extract-on-demand'
    case 'range-fetch':
      return 'extract-range-fetch'
    case 'range-stream':
      return 'extract-range-stream'
    case 'range-fetch-all':
      return 'extract-range-fetch-all'
    case 'range-stream-all':
      return 'extract-range-stream-all'
    case 'range-stream-batch':
      return 'extract-range-stream-batch'
    case 'router-materialize':
      return 'extract-router-materialize'
  }
}

export function labelsForReplayTokenVariant(
  variant: Pick<ReplayTokenVariant, 'algo' | 'channels' | 'loadMode' | 'packCompressor'>,
): ReplayTokenVariantLabels {
  return {
    family: variant.algo,
    encoding: `${variant.algo} · c${variant.channels} · ${variant.packCompressor}`,
    runtimePolicy: runtimePolicyLabel(variant.loadMode),
    transferStyle: transferStyleForLoadMode(variant.loadMode),
  }
}

export function pseudocodeForReplayTokenVariant(
  variant: Pick<ReplayTokenVariant, 'loadMode'>,
): string {
  switch (variant.loadMode) {
    case 'full':
      return `const packCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const pack = await memo(packCache, packId, async () => {
    const response = await nativeFetch(packUrl(packId))
    return decode(await response.blob())
  })

  return new Response(await pack.text(path))
}`
    case 'stream':
      return `const packCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const pack = await memo(packCache, packId, async () => {
    const response = await nativeFetch(packUrl(packId))
    return decodeStream(response.body)
  })

  return new Response(await pack.text(path))
}`
    case 'range-fetch':
      return `const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  return new Response(await memo(fileCache, url, async () => {
    const bytes = await fetchPackFile(remote, path) // buffered Range
    return text(decompress(bytes))
  }))
}`
    case 'range-stream':
      return `const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  return new Response(await memo(fileCache, url, async () => {
    const file = await fetchPackFileStream(remote, path) // streaming Range
    return text(await readStream(file.stream))
  }))
}`
    case 'range-fetch-all':
      return `const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  if (!started(packId)) {
    const allFiles = fetchPackFilesCompressed(remote, remote.allPaths()) // buffered Ranges
    createLazyFilePromises(fileCache, allFiles)
    materializeRemainingFilesInRaf(fileCache)
  }

  return new Response(await fileCache.get(path)) // resolves when this file is ready
}`
    case 'range-stream-all':
      return `const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  if (!started(packId)) {
    const streams = fetchPackFilesStream(remote, remote.allPaths()) // streaming Ranges
    createFilePromises(fileCache, streams)
  }

  return new Response(await fileCache.get(path)) // each file resolves from its stream
}`
    case 'range-stream-batch':
      return `const packCache = new Map()
const fileCache = new Map()

async function fetch(url) {
  const { packId, path } = manifest.lookup(url)
  const remote = await memo(packCache, packId, () => fetchPackManifest(packUrl(packId)))

  return new Response(await memo(fileCache, url, () => {
    queueForTinyWindow(packId, path)
    return batchPromise(packId, path) // grouped fetchPackFilesStream(...)
  }))
}`
    case 'router-materialize':
      return `let router
const fileCache = new Map()

async function fetch(url) {
  const { path } = manifest.lookup(url)
  router ??= await decodeRouter(routerTokenUrl())

  return new Response(await memo(fileCache, url, () => {
    return router.text(path, { strategy: 'auto' })
  }))
}`
  }
}

function runtimePolicyLabel(loadMode: ReplayPackLoadMode): string {
  switch (loadMode) {
    case 'full':
      return 'whole pack buffered fetch + decode'
    case 'stream':
      return 'whole pack fetch + streaming decode'
    case 'range-fetch':
      return 'one requested file via buffered Range'
    case 'range-stream':
      return 'one requested file via Range stream'
    case 'range-fetch-all':
      return 'all files in touched pack via buffered Range'
    case 'range-stream-all':
      return 'all files in touched pack via Range streams'
    case 'range-stream-batch':
      return 'short request window via grouped Range streams'
    case 'router-materialize':
      return 'router token auto strategy + materialization API'
  }
}

function transferStyleForLoadMode(
  loadMode: ReplayPackLoadMode,
): ReplayTokenVariantLabels['transferStyle'] {
  switch (loadMode) {
    case 'full':
    case 'range-fetch':
    case 'range-fetch-all':
      return 'buffered'
    case 'stream':
    case 'range-stream':
    case 'range-stream-all':
    case 'range-stream-batch':
    case 'router-materialize':
      return 'streaming'
  }
}
