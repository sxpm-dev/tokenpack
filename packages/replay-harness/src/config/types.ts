import { z } from 'zod'

export interface CapturedAsset {
  url: string
  seq: number
  status: number
  headers: Readonly<Record<string, string>>
  body: Uint8Array
  /** Raw size in bytes — equal to body.byteLength. Convenience accessor. */
  rawBytes: number
  /**
   * On-the-wire size after Content-Encoding (gzip/br/deflate). Null if
   * Playwright's `response.sizes()` couldn't determine it (e.g. cached,
   * service-worker-fulfilled, redirected). Use this to compare TokenPack
   * size against what the network actually transferred.
   */
  wireBytes: number | null
  /** Content-Encoding header value if present (e.g. 'gzip', 'br'). */
  contentEncoding: string | null
}

export interface ManifestAssetEntry {
  url: string
  packId: string
  internalPath: string
  status: number
  headers: Readonly<Record<string, string>>
}

export interface PackManifest {
  version: 1
  packs: ReadonlyArray<{ id: string; url?: string; localPath?: string }>
  assets: ReadonlyArray<ManifestAssetEntry>
}

export const ThrottleConfigSchema = z.object({
  downloadKbps: z.number().int().positive(),
  uploadKbps: z.number().int().positive(),
  rttMs: z.number().int().nonnegative(),
  cpuSlowdownFactor: z.number().positive(),
})
export type ThrottleConfig = z.infer<typeof ThrottleConfigSchema>

export const JourneyConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('goto-only') }),
  z.object({
    type: z.literal('login-and-open'),
    selectors: z.object({
      email: z.string(),
      password: z.string(),
      submit: z.string(),
      readyAfterLogin: z.string(),
    }),
  }),
  z.object({ type: z.literal('custom'), modulePath: z.string() }),
])
export type JourneyConfig = z.infer<typeof JourneyConfigSchema>

export const TargetConfigSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  url: z.string().url(),
  journey: JourneyConfigSchema,
  authMode: z.enum(['none', 'storageState', 'extraHeaders']).default('none'),
  storageStatePath: z.string().optional(),
  extraHeaders: z.record(z.string(), z.string()).optional(),
  captureGraceMs: z.number().int().nonnegative().default(5000),
})
export type TargetConfig = z.infer<typeof TargetConfigSchema>

export const BenchmarkConfigSchema = z.object({
  target: TargetConfigSchema,
  throttle: ThrottleConfigSchema,
  samples: z.number().int().positive(),
  warmupRuns: z.number().int().nonnegative().default(1),
  outputCsv: z.string(),
})
export type BenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>
