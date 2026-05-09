import type { OptionsSchema } from './options'

/**
 * Merge per-component option schemas into one namespaced schema.
 * Each key gets prefixed with its namespace key (e.g. 'compressor.level',
 * 'surface.channels'). Empty schemas contribute nothing.
 *
 * Used by recipe-shape `AbstractAlgorithm` subclasses to compose their
 * components' tunable options into a single schema the dashboard can
 * read and render.
 */
export function composeOptions(parts: Record<string, OptionsSchema>): OptionsSchema {
  const out: OptionsSchema = {}

  for (const [namespace, schema] of Object.entries(parts)) {
    for (const [key, def] of Object.entries(schema)) {
      out[`${namespace}.${key}`] = def
    }
  }

  return out
}

/**
 * Intersect environment lists across components. Returns the set where every
 * component can run. Any component without a stated `environments` field is
 * assumed to support both.
 */
export function composeEnvironments(
  components: ReadonlyArray<{ environments?: readonly ('node' | 'browser')[] }>,
): ('node' | 'browser')[] {
  const allEnvs: ('node' | 'browser')[] = ['node', 'browser']
  let result = new Set(allEnvs)

  for (const c of components) {
    const envs = c.environments ?? allEnvs
    const env = new Set(envs)

    result = new Set([...result].filter(e => env.has(e)))
  }

  return [...result]
}
