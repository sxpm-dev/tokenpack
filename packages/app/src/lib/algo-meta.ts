import { type AlgorithmInfo, buildAlgorithmInfoFromCtor } from 'tokenpack/algorithms/catalog-info'
import type { AlgorithmCtor } from 'tokenpack/algorithms/types'
import type { OptionsSchema } from 'tokenpack/components/options'

export type CatalogPackage = 'browser' | 'node'

export type AlgoMeta = AlgorithmInfo & {
  implementedIn: CatalogPackage[]
  mirrored: boolean
  optionsSchema: OptionsSchema
  binding: AlgoBinding
}

export interface AlgoBinding {
  title: string
  codec: string
  codecDescription: string
  surface: string
  surfaceDescription: string
  compressor: string
  compressorDescription: string
  drawer: string
  drawerDescription: string
  streamable: boolean
}

export function buildAlgoMeta(Ctor: AlgorithmCtor, implementedIn: CatalogPackage[]): AlgoMeta {
  return {
    ...buildAlgorithmInfoFromCtor(Ctor),
    implementedIn,
    mirrored: implementedIn.includes('browser') && implementedIn.includes('node'),
    optionsSchema: Ctor.optionsSchema,
    binding: describeBinding(Ctor),
  }
}

interface CodecLike {
  name: string
  metadata?: { description?: string }
}

interface SurfaceLike {
  id: string
  description?: string
}

interface DrawerLike {
  id: string
  description?: string
}

function describeBinding(Ctor: AlgorithmCtor): AlgoBinding {
  const codec = new (Ctor.Codec as unknown as new () => CodecLike)()
  const surface = new (Ctor.Surface as unknown as new () => SurfaceLike)()
  const drawer = new (Ctor.Drawer as unknown as new () => DrawerLike)()
  const compressorCtor = Ctor.Compressor as unknown as {
    familyId: string
    description?: string
  }

  return {
    title: Ctor.title ?? Ctor.name,
    codec: codec.name,
    codecDescription: codec.metadata?.description ?? '',
    surface: surface.id,
    surfaceDescription: surface.description ?? '',
    compressor: compressorCtor.familyId,
    compressorDescription: compressorCtor.description ?? '',
    drawer: drawer.id,
    drawerDescription: drawer.description ?? '',
    streamable: Ctor.capabilities.streamable,
  }
}
