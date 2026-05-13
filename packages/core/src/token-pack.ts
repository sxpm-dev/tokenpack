import { PackBuilder } from './pack-builder'
import type { RouterBuildOptions, RouterTokenPack } from './router/types'

export class TokenPack extends PackBuilder {
  router(options: RouterBuildOptions = {}): RouterTokenPack {
    return {
      kind: 'router-token-pack',
      source: this,
      options,
    }
  }
}

export function isRouterTokenPack(value: unknown): value is RouterTokenPack {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'router-token-pack'
  )
}
