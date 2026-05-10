import type { CodecMetadata, Friendliness } from '../codecs/types'
import { compressorRegistry } from '../compressors/registry'
import { IMAGE_FORMATS, SURFACE_INFOS } from '../surfaces/info'

import type { AlgorithmCatalog } from './catalog'
import type { AlgorithmCtor } from './types'

export type AlgorithmEnvironment = 'node' | 'browser'

export interface AlgorithmInfo {
  id: number
  name: string
  description: string
  pixelLayout: string
  writeStyle: string
  dependencies: string
  beFriendly: Friendliness
  feFriendly: Friendliness
  streamFriendly: Friendliness
  approxRatio: string
  requiredChannels: 1 | 2 | 3 | 4 | null
  options: string[]
  /** Environments where this algorithm can run end-to-end (encode + decode). */
  environments: AlgorithmEnvironment[]
}

function describeOptions(meta?: CodecMetadata): string[] {
  const channels = meta?.requiredChannels ? `channels: ${meta.requiredChannels}` : 'channels: 1-4'
  const families = compressorRegistry
    .listFamilies()
    .map(C => C.familyId)
    .filter(id => id !== 'none')
    .join(' / ')

  return [channels, `outer compression: none / ${families}`]
}

/** Build AlgorithmInfo from a registered Ctor. Pulls codec metadata when the
 *  bound Codec class exposes it (most pixel-data algorithms); otherwise falls
 *  back to the algorithm's own static description fields. */
export function buildAlgorithmInfoFromCtor(Ctor: AlgorithmCtor): AlgorithmInfo {
  const codecCls = Ctor.Codec as unknown as { metadata?: CodecMetadata }
  const meta = codecCls?.metadata
  const caps = Ctor.capabilities
  const ctorMeta = Ctor as unknown as { description?: string; title?: string }

  return {
    id: Ctor.id,
    name: Ctor.name,
    description: ctorMeta.description ?? meta?.description ?? Ctor.name,
    pixelLayout: meta?.pixelLayout ?? 'n/a',
    writeStyle: meta?.writeStyle ?? 'side-channel',
    dependencies: meta?.dependencies ?? 'none',
    beFriendly: caps.environments.includes('node') ? 'yes' : 'no',
    feFriendly: caps.environments.includes('browser') ? 'yes' : 'no',
    streamFriendly: caps.streamable ? 'yes' : 'no',
    approxRatio: meta?.approxRatio ?? 'unknown',
    requiredChannels: meta?.requiredChannels ?? null,
    options: meta
      ? describeOptions(meta)
      : [`surface: ${caps.surface}`, `channels: ${caps.channels.join('/')}`],
    environments: [...caps.environments],
  }
}

/** Live view of all registered algorithms. Reads catalog at access time. */
export function listAlgorithmInfos(catalog: AlgorithmCatalog): AlgorithmInfo[] {
  return catalog.list().map(buildAlgorithmInfoFromCtor)
}

export { IMAGE_FORMATS, SURFACE_INFOS }
