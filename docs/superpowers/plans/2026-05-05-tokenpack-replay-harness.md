# TokenPack Replay Harness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a target-agnostic Playwright-driven harness that captures any web app's asset graph, encodes it as a TokenPack, and replays the page load via streaming-decode interception — producing baseline-vs-TokenPack timing CSVs under matched throttle.

**Architecture:** A new top-level package `tokenpack-replay-harness` in the existing yarn workspace. Node-side controller drives Chromium via Playwright + CDP. A small bootstrap injected into the page fetches the pack via the browser's own (throttled) fetch and streams it through `@tokenpack/core`'s decoder; a `Runtime.addBinding` channel passes decoded asset bytes back to Node, which fulfills intercepted `Fetch.requestPaused` events.

**Tech Stack:** TypeScript (ESM), yarn 4 workspaces, Playwright, `@tokenpack/core` (`packBuffers` / `unpackBuffers` from `./archive`), `@tokenpack/browser` (`decode` from `./decode`), vitest, Zod, pino, esbuild (bundles bootstrap), AWS SDK v3 S3 client (R2/B2/S3-compatible upload).

**No CLI wrapper.** Each operation is a `bin/*.ts` script invoked directly via `yarn workspace tokenpack-replay-harness run <script>`. No yargs, no shared dispatcher — these are perf-test scripts, not a distributed tool.

**Scope of this plan (Phases 0–6):** package skeleton → recorder → encoder → local replay round-trip → browser bridge with streaming → CDN upload + throttle → benchmark orchestrator + CSV → auth (storageState + extra headers). **Phase 7 (diff-versioning replay) is intentionally a separate follow-up plan** — it builds on a working capture/replay loop and adds independent design decisions (diff format application, multi-version cache, applyDiff plumbing).

**Spec:** `docs/superpowers/specs/2026-05-05-tokenpack-replay-harness-poc-design.md`.

---

## File structure (locked-in decomposition)

```
packages/replay-harness/
  package.json                                  Task 0.1
  tsconfig.json                                 Task 0.1
  eslint.config.mjs                             Task 0.1
  README.md                                     Task 0.1
  src/
    config/
      types.ts                                  Task 0.2  shared types + Zod schemas
      throttles.ts                              Task 4.3  named throttle presets
      targets/
        public-demo.ts                          Task 1.7  shipped no-auth example
    log/
      logger.ts                                 Task 1.3  pino instance
    record/
      recorder.ts                               Task 1.4  Playwright response capture
      journey.ts                                Task 1.4  journey runner
    encode/
      url-to-path.ts                            Task 1.1  pure: URL → internalPath
      header-scrubber.ts                        Task 1.2  pure: allowlist filter
      manifest.ts                               Task 1.5  pure: build PackManifest
      encoder.ts                                Task 1.6  packBuffers + write files
    upload/
      s3-uploader.ts                            Task 4.1  S3-compatible PUT
    replay/
      throttle.ts                               Task 2.2  CDP throttle helper
      timings.ts                                Task 5.1  collect metrics
      baseline.ts                               Task 2.3  pass-through replayer
      tokenpack-local.ts                        Task 2.4  local-mode replayer (Phase 2 stepping stone)
      bridge.ts                                 Task 3.3  Node↔browser binding manager
      tokenpack.ts                              Task 3.4  bridge-mode replayer (replaces local)
      orchestrator.ts                           Task 5.3  alternated runs, fresh contexts
    browser/
      bootstrap.ts                              Task 3.1  source for the injected JS
      build-bootstrap.ts                        Task 3.2  esbuild → bundled string
    report/
      csv.ts                                    Task 5.2  CSV writer
  bin/
    record.ts                                   Task 1.7
    encode.ts                                   Task 1.6 / 1.7 split: encode invoked from record
    upload.ts                                   Task 4.2
    benchmark.ts                                Task 5.4
    login.ts                                    Task 6.1
  fixtures/
    .gitignore                                  Task 0.1  (ignore storageState.json, packs)
  results/
    .gitignore                                  Task 0.1  (ignore *.csv)
  test/
    unit/
      url-to-path.test.ts                       Task 1.1
      header-scrubber.test.ts                   Task 1.2
      manifest.test.ts                          Task 1.5
      csv.test.ts                               Task 5.2
    integration/
      fixture-server.ts                         Task 2.5  shared in-process HTTP fixture
      record-encode-local-replay.test.ts        Task 2.5
      record-encode-bridge-replay.test.ts       Task 3.5
      throttle-applies.test.ts                  Task 4.4
```

Existing files modified:
- `package.json` (root): add `packages/replay-harness` to `workspaces` (already covered by `packages/*` glob — verify in Task 0.1).

No changes to `@tokenpack/core` or `@tokenpack/browser` are required by this plan.

---

## Phase 0 — Skeleton

### Task 0.1: Create package skeleton

**Files:**
- Create: `packages/replay-harness/package.json`
- Create: `packages/replay-harness/tsconfig.json`
- Create: `packages/replay-harness/eslint.config.mjs`
- Create: `packages/replay-harness/README.md`
- Create: `packages/replay-harness/fixtures/.gitignore`
- Create: `packages/replay-harness/results/.gitignore`
- Verify: root `package.json` workspace glob covers the new package.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "tokenpack-replay-harness",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "description": "Playwright-driven harness that benchmarks page load with TokenPack interception against a baseline, on any target URL.",
  "license": "MIT",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "eslint src test",
    "lint:fix": "eslint src test --fix",
    "test": "vitest run",
    "test:watch": "vitest",
    "record": "tsx bin/record.ts",
    "encode": "tsx bin/encode.ts",
    "upload": "tsx bin/upload.ts",
    "benchmark": "tsx bin/benchmark.ts",
    "login": "tsx bin/login.ts"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.658.0",
    "@tokenpack/browser": "workspace:^",
    "esbuild": "^0.24.0",
    "pino": "^9.5.0",
    "pino-pretty": "^11.3.0",
    "playwright": "^1.48.0",
    "tokenpack": "workspace:^",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.7.5",
    "tsx": "^4.19.1",
    "typescript": "^5.6.3",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "bin/**/*", "test/**/*"]
}
```

- [ ] **Step 3: Create eslint.config.mjs**

```javascript
import baseConfig from '@tokenpack/eslint-config'

export default [
  ...baseConfig,
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  }
]
```

If the workspace's shared eslint config does not exist or does not export this shape, replace the import with whatever `packages/core/eslint.config.mjs` does (read it first).

- [ ] **Step 4: Create README.md**

```markdown
# tokenpack-replay-harness

Playwright-driven harness for measuring TokenPack-based page-load delivery against a baseline, on any target URL.

## Usage

```
yarn workspace tokenpack-replay-harness run record --target public-demo
yarn workspace tokenpack-replay-harness run encode --target public-demo
yarn workspace tokenpack-replay-harness run upload --target public-demo
yarn workspace tokenpack-replay-harness run benchmark --target public-demo --samples 10
```

See `docs/superpowers/specs/2026-05-05-tokenpack-replay-harness-poc-design.md`.
```

- [ ] **Step 5: Create the two .gitignore files**

`packages/replay-harness/fixtures/.gitignore`:
```
*
!.gitignore
```

`packages/replay-harness/results/.gitignore`:
```
*.csv
```

- [ ] **Step 6: Verify workspace pickup**

Run:
```bash
yarn install
yarn workspace tokenpack-replay-harness run --help
```

Expected: install succeeds; yarn lists scripts (record / encode / upload / benchmark / login / build / lint / test).

- [ ] **Step 7: Commit**

```bash
git add packages/replay-harness/
git commit -m "feat(replay-harness): scaffold tokenpack-replay-harness package"
```

---

### Task 0.2: Define shared config types and Zod schemas

**Files:**
- Create: `packages/replay-harness/src/config/types.ts`

- [ ] **Step 1: Write types.ts**

```typescript
import { z } from 'zod'

export interface CapturedAsset {
  url: string
  seq: number
  status: number
  headers: Readonly<Record<string, string>>
  body: Uint8Array
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
  cpuSlowdownFactor: z.number().positive()
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
      readyAfterLogin: z.string()
    })
  }),
  z.object({ type: z.literal('custom'), modulePath: z.string() })
])
export type JourneyConfig = z.infer<typeof JourneyConfigSchema>

export const TargetConfigSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  url: z.string().url(),
  journey: JourneyConfigSchema,
  authMode: z.enum(['none', 'storageState', 'extraHeaders']).default('none'),
  storageStatePath: z.string().optional(),
  extraHeaders: z.record(z.string(), z.string()).optional(),
  captureGraceMs: z.number().int().nonnegative().default(5000)
})
export type TargetConfig = z.infer<typeof TargetConfigSchema>

export const BenchmarkConfigSchema = z.object({
  target: TargetConfigSchema,
  throttle: ThrottleConfigSchema,
  samples: z.number().int().positive(),
  warmupRuns: z.number().int().nonnegative().default(1),
  outputCsv: z.string()
})
export type BenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>
```

- [ ] **Step 2: Verify it type-checks**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS (emits `dist/`).

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/config/types.ts
git commit -m "feat(replay-harness): define shared config types and Zod schemas"
```

---

## Phase 1 — Recorder + Encoder

### Task 1.1: URL-to-internalPath sanitizer (TDD)

**Files:**
- Create: `packages/replay-harness/test/unit/url-to-path.test.ts`
- Create: `packages/replay-harness/src/encode/url-to-path.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest'
import { urlToInternalPath } from '../../src/encode/url-to-path.js'

describe('urlToInternalPath', () => {
  it('preserves host and path with safe characters', () => {
    expect(urlToInternalPath('https://cdn.example.com/lib/foo.js'))
      .toBe('cdn.example.com/lib/foo.js')
  })

  it('hashes the query string into the filename', () => {
    const a = urlToInternalPath('https://x.com/a.js?v=1')
    const b = urlToInternalPath('https://x.com/a.js?v=2')
    expect(a).not.toBe(b)
    expect(a.startsWith('x.com/a.js')).toBe(true)
  })

  it('replaces unsafe path characters', () => {
    expect(urlToInternalPath('https://x.com/a%20b/c:d.js'))
      .toMatch(/^x\.com\/a_20b\/c_d\.js$/)
  })

  it('encodes ports', () => {
    expect(urlToInternalPath('https://x.com:8443/a.js'))
      .toBe('x.com_8443/a.js')
  })

  it('handles missing path', () => {
    expect(urlToInternalPath('https://x.com')).toBe('x.com/_root')
  })

  it('is deterministic', () => {
    const u = 'https://x.com/a.js?v=1&q=2'
    expect(urlToInternalPath(u)).toBe(urlToInternalPath(u))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace tokenpack-replay-harness test url-to-path`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
import { createHash } from 'node:crypto'

const UNSAFE = /[^a-zA-Z0-9._\-/]/g

export function urlToInternalPath(input: string): string {
  const url = new URL(input)
  const hostPart = url.port ? `${url.host.replace(`:${url.port}`, '')}_${url.port}` : url.host
  const path = url.pathname === '' || url.pathname === '/' ? '/_root' : url.pathname
  const safePath = path.replace(UNSAFE, c => '_' + c.charCodeAt(0).toString(16))

  if (url.search === '') {
    return `${hostPart}${safePath}`
  }

  const queryHash = createHash('sha256').update(url.search).digest('hex').slice(0, 8)
  const dot = safePath.lastIndexOf('.')
  const insertAt = dot > safePath.lastIndexOf('/') ? dot : safePath.length
  return `${hostPart}${safePath.slice(0, insertAt)}.${queryHash}${safePath.slice(insertAt)}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace tokenpack-replay-harness test url-to-path`
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/replay-harness/src/encode/url-to-path.ts packages/replay-harness/test/unit/url-to-path.test.ts
git commit -m "feat(replay-harness): URL → internal-path sanitizer"
```

---

### Task 1.2: Header scrubber (TDD)

**Files:**
- Create: `packages/replay-harness/test/unit/header-scrubber.test.ts`
- Create: `packages/replay-harness/src/encode/header-scrubber.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest'
import { scrubHeaders } from '../../src/encode/header-scrubber.js'

describe('scrubHeaders', () => {
  it('keeps content-type and cache-control', () => {
    const out = scrubHeaders({
      'content-type': 'application/javascript',
      'cache-control': 'public, max-age=31536000'
    })
    expect(out).toEqual({
      'content-type': 'application/javascript',
      'cache-control': 'public, max-age=31536000'
    })
  })

  it('strips set-cookie', () => {
    const out = scrubHeaders({
      'content-type': 'text/html',
      'set-cookie': 'session=abc; HttpOnly'
    })
    expect(out['set-cookie']).toBeUndefined()
    expect(out['content-type']).toBe('text/html')
  })

  it('strips authorization echo and any other non-allowlisted', () => {
    const out = scrubHeaders({
      authorization: 'Bearer secret',
      'x-tracking-id': 'tracker',
      'content-type': 'application/json'
    })
    expect(out).toEqual({ 'content-type': 'application/json' })
  })

  it('lowercases keys', () => {
    const out = scrubHeaders({ 'Content-Type': 'text/css', 'ETAG': '"abc"' })
    expect(out).toEqual({ 'content-type': 'text/css', etag: '"abc"' })
  })

  it('returns a frozen object', () => {
    const out = scrubHeaders({ 'content-type': 'text/css' })
    expect(Object.isFrozen(out)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace tokenpack-replay-harness test header-scrubber`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
const ALLOW = new Set([
  'content-type',
  'content-encoding',
  'content-language',
  'cache-control',
  'etag',
  'last-modified',
  'expires',
  'vary',
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'access-control-expose-headers',
  'cross-origin-resource-policy',
  'sourcemap',
  'x-sourcemap',
  'integrity'
])

export function scrubHeaders(input: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    const lower = key.toLowerCase()
    if (ALLOW.has(lower)) {
      out[lower] = value
    }
  }
  return Object.freeze(out)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace tokenpack-replay-harness test header-scrubber`
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/replay-harness/src/encode/header-scrubber.ts packages/replay-harness/test/unit/header-scrubber.test.ts
git commit -m "feat(replay-harness): header allowlist scrubber"
```

---

### Task 1.3: Logger setup

**Files:**
- Create: `packages/replay-harness/src/log/logger.ts`

- [ ] **Step 1: Write logger.ts**

```typescript
import pino from 'pino'

const transport = process.env.NODE_ENV === 'production'
  ? undefined
  : pino.transport({ target: 'pino-pretty', options: { colorize: true, singleLine: true } })

export const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' }, transport)
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/log/logger.ts
git commit -m "feat(replay-harness): pino logger"
```

---

### Task 1.4: Recorder + journey runner

**Files:**
- Create: `packages/replay-harness/src/record/journey.ts`
- Create: `packages/replay-harness/src/record/recorder.ts`

- [ ] **Step 1: Write journey.ts**

```typescript
import type { Page } from 'playwright'
import type { JourneyConfig } from '../config/types.js'

export async function runJourney(page: Page, journey: JourneyConfig): Promise<void> {
  switch (journey.type) {
    case 'goto-only':
      return

    case 'login-and-open': {
      const { selectors } = journey
      await page.fill(selectors.email, process.env.LOGIN_EMAIL ?? '')
      await page.fill(selectors.password, process.env.LOGIN_PASSWORD ?? '')
      await page.click(selectors.submit)
      await page.waitForSelector(selectors.readyAfterLogin)
      return
    }

    case 'custom': {
      const mod = (await import(journey.modulePath)) as { default: (page: Page) => Promise<void> }
      await mod.default(page)
      return
    }
  }
}
```

- [ ] **Step 2: Write recorder.ts**

```typescript
import type { BrowserContext, Page } from 'playwright'
import { chromium } from 'playwright'
import type { CapturedAsset, TargetConfig } from '../config/types.js'
import { runJourney } from './journey.js'
import { scrubHeaders } from '../encode/header-scrubber.js'
import { logger } from '../log/logger.js'

export interface RecordResult {
  target: TargetConfig
  capturedAt: string                            // ISO timestamp
  assets: CapturedAsset[]
}

export interface RecordOptions {
  storageStatePath?: string
  extraHeaders?: Record<string, string>
}

export async function record(target: TargetConfig, options: RecordOptions = {}): Promise<RecordResult> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context: BrowserContext = await browser.newContext({
      storageState: options.storageStatePath
    })
    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    const page: Page = await context.newPage()

    const assets: CapturedAsset[] = []
    let seq = 0

    page.on('response', async (resp) => {
      const req = resp.request()
      if (req.method() !== 'GET') return
      const status = resp.status()
      if (status >= 300) return
      const headers = resp.headers()
      if (headers['cache-control']?.includes('no-store')) return

      try {
        const body = await resp.body()
        if (body.length === 0) return
        assets.push({
          url: resp.url(),
          seq: seq++,
          status,
          headers: scrubHeaders(headers),
          body: new Uint8Array(body)
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'unknown'
        logger.warn({ url: resp.url(), reason: message }, 'response body unavailable')
      }
    })

    logger.info({ url: target.url }, 'navigating')
    await page.goto(target.url, { waitUntil: 'load' })
    await runJourney(page, target.journey)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(target.captureGraceMs ?? 5000)

    logger.info({ count: assets.length, totalBytes: assets.reduce((s, a) => s + a.body.byteLength, 0) }, 'recorded')

    return { target, capturedAt: new Date().toISOString(), assets }
  } finally {
    await browser.close()
  }
}
```

- [ ] **Step 3: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/replay-harness/src/record/
git commit -m "feat(replay-harness): recorder and journey runner"
```

---

### Task 1.5: Manifest builder (TDD)

**Files:**
- Create: `packages/replay-harness/test/unit/manifest.test.ts`
- Create: `packages/replay-harness/src/encode/manifest.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest'
import type { CapturedAsset } from '../../src/config/types.js'
import { buildManifest } from '../../src/encode/manifest.js'

const asset = (url: string, seq: number, ct: string): CapturedAsset => ({
  url,
  seq,
  status: 200,
  headers: { 'content-type': ct },
  body: new Uint8Array([1, 2, 3])
})

describe('buildManifest', () => {
  it('groups all assets into a single pack with id "main"', () => {
    const m = buildManifest('main', [
      asset('https://x.com/a.js', 0, 'application/javascript'),
      asset('https://x.com/b.css', 1, 'text/css')
    ])
    expect(m.packs).toEqual([{ id: 'main' }])
    expect(m.assets.length).toBe(2)
    expect(m.assets[0]?.packId).toBe('main')
  })

  it('sorts manifest assets by capture sequence', () => {
    const m = buildManifest('main', [
      asset('https://x.com/b.js', 5, 'application/javascript'),
      asset('https://x.com/a.js', 1, 'application/javascript')
    ])
    expect(m.assets[0]?.url).toBe('https://x.com/a.js')
    expect(m.assets[1]?.url).toBe('https://x.com/b.js')
  })

  it('passes status and headers through untouched', () => {
    const m = buildManifest('main', [asset('https://x.com/a.js', 0, 'application/javascript')])
    expect(m.assets[0]?.status).toBe(200)
    expect(m.assets[0]?.headers['content-type']).toBe('application/javascript')
  })

  it('uses urlToInternalPath for internalPath', () => {
    const m = buildManifest('main', [asset('https://x.com/a.js?v=1', 0, 'application/javascript')])
    expect(m.assets[0]?.internalPath.startsWith('x.com/a.')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace tokenpack-replay-harness test manifest`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
import type { CapturedAsset, ManifestAssetEntry, PackManifest } from '../config/types.js'
import { urlToInternalPath } from './url-to-path.js'

export function buildManifest(packId: string, assets: ReadonlyArray<CapturedAsset>): PackManifest {
  const sorted = [...assets].sort((a, b) => a.seq - b.seq)

  const entries: ManifestAssetEntry[] = sorted.map(a => ({
    url: a.url,
    packId,
    internalPath: urlToInternalPath(a.url),
    status: a.status,
    headers: a.headers
  }))

  return {
    version: 1,
    packs: [{ id: packId }],
    assets: entries
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace tokenpack-replay-harness test manifest`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/replay-harness/src/encode/manifest.ts packages/replay-harness/test/unit/manifest.test.ts
git commit -m "feat(replay-harness): manifest builder"
```

---

### Task 1.6: Encoder

**Files:**
- Create: `packages/replay-harness/src/encode/encoder.ts`

- [ ] **Step 1: Write encoder.ts**

```typescript
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { packBuffers } from 'tokenpack/archive'
import type { CapturedAsset, PackManifest } from '../config/types.js'
import { buildManifest } from './manifest.js'
import { logger } from '../log/logger.js'

export interface EncodeResult {
  packPath: string
  manifestPath: string
  manifest: PackManifest
  packBytes: Uint8Array
}

export async function encode(
  packId: string,
  assets: ReadonlyArray<CapturedAsset>,
  outDir: string
): Promise<EncodeResult> {
  const manifest = buildManifest(packId, assets)

  const sortedByManifest = manifest.assets.map(entry => {
    const captured = assets.find(a => a.url === entry.url)
    if (!captured) throw new Error(`Manifest entry has no captured asset: ${entry.url}`)
    return { path: entry.internalPath, bytes: captured.body }
  })

  const packBytes = packBuffers(sortedByManifest)

  const packPath = `${outDir}/${packId}.cart`
  const manifestPath = `${outDir}/${packId}.manifest.json`

  await mkdir(dirname(packPath), { recursive: true })
  await writeFile(packPath, packBytes)
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  logger.info({ packPath, manifestPath, byteSize: packBytes.byteLength, assets: assets.length }, 'encoded')

  return { packPath, manifestPath, manifest, packBytes }
}
```

> **Note on the file extension:** the on-disk pack here is the raw CART blob (`packBuffers` output). The PNG carrier wrapping is added at upload time by the existing `@tokenpack/core` encoder pipeline; for the POC we keep both surfaces — CART for local replay (Phase 2), PNG for over-wire replay (Phase 4). Phase 4 invokes `encodeToBuffer` on top.

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/encode/encoder.ts
git commit -m "feat(replay-harness): encoder writes CART pack + manifest"
```

---

### Task 1.7: `record` script + ships public-demo target

**Files:**
- Create: `packages/replay-harness/src/config/targets/public-demo.ts`
- Create: `packages/replay-harness/bin/record.ts`

- [ ] **Step 1: Create public-demo target**

```typescript
import type { TargetConfig } from '../types.js'

export const publicDemo: TargetConfig = {
  id: 'public-demo',
  url: 'https://example.com',
  journey: { type: 'goto-only' },
  authMode: 'none',
  captureGraceMs: 2000
}
```

- [ ] **Step 2: Write bin/record.ts**

```typescript
import { record } from '../src/record/recorder.js'
import { encode } from '../src/encode/encoder.js'
import { publicDemo } from '../src/config/targets/public-demo.js'
import { logger } from '../src/log/logger.js'

const targetId = process.argv[2] ?? 'public-demo'

const targets = { 'public-demo': publicDemo } as const

const target = targets[targetId as keyof typeof targets]
if (!target) {
  logger.error({ targetId }, 'unknown target')
  process.exit(1)
}

const result = await record(target)
const out = await encode(target.id, result.assets, `fixtures/${target.id}`)

logger.info({
  packPath: out.packPath,
  manifestPath: out.manifestPath,
  assets: out.manifest.assets.length
}, 'record + encode complete')
```

- [ ] **Step 3: Run end-to-end against public-demo**

Run:
```bash
yarn workspace tokenpack-replay-harness run record public-demo
```

Expected: completes; produces `packages/replay-harness/fixtures/public-demo/public-demo.cart` + `public-demo.manifest.json`. Manifest has at least 1 asset (the example.com HTML body itself is excluded — only sub-resources, but example.com has none, so this may produce zero. If zero, swap to `https://www.iana.org/help/example-domains` which has a CSS load).

If zero assets: change the URL in `public-demo.ts` to `https://playwright.dev` (heavy enough to verify capture).

- [ ] **Step 4: Commit**

```bash
git add packages/replay-harness/src/config/targets/ packages/replay-harness/bin/record.ts
git commit -m "feat(replay-harness): record script + public-demo target"
```

---

## Phase 2 — Local replay round-trip (sanity)

### Task 2.1: Manifest loader

**Files:**
- Create: `packages/replay-harness/src/replay/manifest-loader.ts`

- [ ] **Step 1: Write manifest-loader.ts**

```typescript
import { readFile } from 'node:fs/promises'
import type { PackManifest } from '../config/types.js'

export async function loadManifest(path: string): Promise<PackManifest> {
  const raw = await readFile(path, 'utf8')
  const parsed = JSON.parse(raw) as PackManifest
  if (parsed.version !== 1) {
    throw new Error(`Unsupported manifest version: ${parsed.version}`)
  }
  return parsed
}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/replay/manifest-loader.ts
git commit -m "feat(replay-harness): manifest loader"
```

---

### Task 2.2: Throttle helper

**Files:**
- Create: `packages/replay-harness/src/replay/throttle.ts`

- [ ] **Step 1: Write throttle.ts**

```typescript
import type { CDPSession } from 'playwright'
import type { ThrottleConfig } from '../config/types.js'

export async function applyThrottle(client: CDPSession, throttle: ThrottleConfig): Promise<void> {
  const downloadBps = (throttle.downloadKbps * 1024) / 8
  const uploadBps = (throttle.uploadKbps * 1024) / 8

  await client.send('Network.enable')
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: throttle.rttMs,
    downloadThroughput: downloadBps,
    uploadThroughput: uploadBps
  })

  await client.send('Emulation.setCPUThrottlingRate', { rate: throttle.cpuSlowdownFactor })
}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/replay/throttle.ts
git commit -m "feat(replay-harness): CDP throttle helper"
```

---

### Task 2.3: Baseline replayer

**Files:**
- Create: `packages/replay-harness/src/replay/baseline.ts`

- [ ] **Step 1: Write baseline.ts**

```typescript
import { chromium } from 'playwright'
import type { TargetConfig, ThrottleConfig } from '../config/types.js'
import { runJourney } from '../record/journey.js'
import { applyThrottle } from './throttle.js'
import { logger } from '../log/logger.js'

export interface BaselineResult {
  durationMs: number
  loadEventMs: number | null
}

export interface BaselineOptions {
  throttle?: ThrottleConfig
  storageStatePath?: string
  extraHeaders?: Record<string, string>
}

export async function runBaseline(target: TargetConfig, options: BaselineOptions = {}): Promise<BaselineResult> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      storageState: options.storageStatePath
    })
    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    const page = await context.newPage()
    const client = await context.newCDPSession(page)

    if (options.throttle) await applyThrottle(client, options.throttle)

    let loadEventMs: number | null = null
    page.on('load', () => {
      loadEventMs = performance.now() - started
    })

    const started = performance.now()
    await page.goto(target.url, { waitUntil: 'load' })
    await runJourney(page, target.journey)
    await page.waitForLoadState('networkidle')
    const durationMs = performance.now() - started

    logger.info({ mode: 'baseline', durationMs, loadEventMs }, 'baseline run complete')
    return { durationMs, loadEventMs }
  } finally {
    await browser.close()
  }
}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/replay/baseline.ts
git commit -m "feat(replay-harness): baseline replayer"
```

---

### Task 2.4: Local-mode TokenPack replayer (stepping stone)

**Files:**
- Create: `packages/replay-harness/src/replay/tokenpack-local.ts`

This task is a deliberate stepping stone — it serves intercepted requests from a fully-decoded in-memory map, bypassing streaming. Phase 3 replaces it with the real bridge. Keeping this in tree validates the `Fetch.requestPaused` plumbing in isolation.

- [ ] **Step 1: Write tokenpack-local.ts**

```typescript
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { unpackBuffers } from 'tokenpack/archive'
import type { TargetConfig, ThrottleConfig, PackManifest } from '../config/types.js'
import { runJourney } from '../record/journey.js'
import { applyThrottle } from './throttle.js'
import { loadManifest } from './manifest-loader.js'
import { logger } from '../log/logger.js'

export interface LocalReplayResult {
  durationMs: number
  loadEventMs: number | null
  served: number
  fellThrough: number
}

export interface LocalReplayOptions {
  throttle?: ThrottleConfig
  storageStatePath?: string
  extraHeaders?: Record<string, string>
}

export async function runTokenpackLocal(
  target: TargetConfig,
  packPath: string,
  manifestPath: string,
  options: LocalReplayOptions = {}
): Promise<LocalReplayResult> {
  const manifest = await loadManifest(manifestPath)
  const packBytes = await readFile(packPath)
  const entries = unpackBuffers(new Uint8Array(packBytes))
  const byInternalPath = new Map(entries.map(e => [e.path, e.bytes]))
  const byUrl = new Map(manifest.assets.map(a => [a.url, a]))

  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      storageState: options.storageStatePath
    })
    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    const page = await context.newPage()
    const client = await context.newCDPSession(page)

    if (options.throttle) await applyThrottle(client, options.throttle)

    let served = 0
    let fellThrough = 0

    await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
    client.on('Fetch.requestPaused', async (event) => {
      const entry = byUrl.get(event.request.url)
      const bytes = entry ? byInternalPath.get(entry.internalPath) : undefined

      if (entry && bytes) {
        served++
        await client.send('Fetch.fulfillRequest', {
          requestId: event.requestId,
          responseCode: entry.status,
          responseHeaders: Object.entries(entry.headers).map(([name, value]) => ({ name, value })),
          body: Buffer.from(bytes).toString('base64')
        })
      } else {
        fellThrough++
        await client.send('Fetch.continueRequest', { requestId: event.requestId })
      }
    })

    let loadEventMs: number | null = null
    page.on('load', () => { loadEventMs = performance.now() - started })

    const started = performance.now()
    await page.goto(target.url, { waitUntil: 'load' })
    await runJourney(page, target.journey)
    await page.waitForLoadState('networkidle')
    const durationMs = performance.now() - started

    logger.info({ mode: 'tokenpack-local', durationMs, loadEventMs, served, fellThrough }, 'local replay complete')
    return { durationMs, loadEventMs, served, fellThrough }
  } finally {
    await browser.close()
  }
}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/replay/tokenpack-local.ts
git commit -m "feat(replay-harness): local-mode tokenpack replayer (Phase 2 stepping stone)"
```

---

### Task 2.5: Integration test — record → encode → local replay round-trip

**Files:**
- Create: `packages/replay-harness/test/integration/fixture-server.ts`
- Create: `packages/replay-harness/test/integration/record-encode-local-replay.test.ts`

- [ ] **Step 1: Write fixture-server.ts**

```typescript
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface FixtureServer {
  url: string
  close: () => Promise<void>
}

export async function startFixtureServer(): Promise<FixtureServer> {
  const html = `<!doctype html><html><head>
    <link rel="stylesheet" href="/a.css">
    <script src="/b.js" defer></script>
    </head><body>fixture</body></html>`
  const css = 'body{background:#eef}'
  const js = 'window.__loaded=true'

  const server: Server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-cache' })
      res.end(html)
    } else if (req.url === '/a.css') {
      res.writeHead(200, { 'content-type': 'text/css', 'cache-control': 'public,max-age=60' })
      res.end(css)
    } else if (req.url === '/b.js') {
      res.writeHead(200, { 'content-type': 'application/javascript', 'cache-control': 'public,max-age=60' })
      res.end(js)
    } else {
      res.writeHead(404).end()
    }
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port

  return {
    url: `http://127.0.0.1:${port}/`,
    close: () => new Promise<void>((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve()))
  }
}
```

- [ ] **Step 2: Write record-encode-local-replay.test.ts**

```typescript
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { record } from '../../src/record/recorder.js'
import { encode } from '../../src/encode/encoder.js'
import { runTokenpackLocal } from '../../src/replay/tokenpack-local.js'
import type { TargetConfig } from '../../src/config/types.js'
import { startFixtureServer, type FixtureServer } from './fixture-server.js'

let server: FixtureServer
let tmp: string

beforeAll(async () => {
  server = await startFixtureServer()
  tmp = mkdtempSync(join(tmpdir(), 'replay-harness-'))
})

afterAll(async () => {
  await server.close()
  rmSync(tmp, { recursive: true, force: true })
})

it('records, encodes, and serves all sub-resources from the pack on replay', async () => {
  const target: TargetConfig = {
    id: 'fixture',
    url: server.url,
    journey: { type: 'goto-only' },
    authMode: 'none',
    captureGraceMs: 500
  }

  const recorded = await record(target)
  expect(recorded.assets.length).toBeGreaterThanOrEqual(2)   // css + js (HTML excluded by no-store? confirm)

  const out = await encode(target.id, recorded.assets, tmp)
  expect(out.manifest.assets.length).toBe(recorded.assets.length)

  const replay = await runTokenpackLocal(target, out.packPath, out.manifestPath)
  expect(replay.served).toBeGreaterThanOrEqual(2)
  expect(replay.fellThrough).toBe(1)                          // HTML doc page itself falls through
}, 60_000)
```

- [ ] **Step 3: Run the integration test**

Run: `yarn workspace tokenpack-replay-harness test record-encode-local-replay`
Expected: PASS.

If `recorded.assets.length` is 1 (HTML included), update the recorder to skip the navigation document (filter on `req.resourceType() !== 'document'`) and re-run. Adjust expectations accordingly.

- [ ] **Step 4: Commit**

```bash
git add packages/replay-harness/test/integration/
git commit -m "test(replay-harness): record→encode→local-replay integration test"
```

---

## Phase 3 — Browser bridge (real streaming)

### Task 3.1: Browser bootstrap source

**Files:**
- Create: `packages/replay-harness/src/browser/bootstrap.ts`

The bootstrap runs **inside the browser**. It fetches the pack URL using the browser's fetch (so CDP throttle applies), parses the CART blob, and calls a `window.__bridge_asset` binding (registered by the Node side via `Runtime.addBinding`) for each emitted entry.

> **POC limitation noted in spec Risk #2:** for v1 of the bridge we wait for the full pack to finish downloading before parsing entries (`unpackBuffers` is a synchronous parse over the complete CART blob). This still measures the streaming-overlap claim *partially* — the pack's download still overlaps with the page's HTML parse and JS-execution waterfall, but individual asset emission does not begin until the last byte arrives. A follow-up task (Phase 8 / future plan) would replace this with a true streaming CART parser. For the POC, this is acceptable and the report calls it out.

- [ ] **Step 1: Write bootstrap.ts**

```typescript
// Runs inside the browser, injected via addInitScript.
// Globals provided by the Node bridge:
//   - window.__bridge_asset(payloadJson: string): void
//     payload: { url, status, headers, bytesB64 }
//   - window.__bridge_done(metaJson: string): void
//     payload: { count, totalBytes }
// Globals read from the page:
//   - window.__PACK_URL: string
//   - window.__MANIFEST: { assets: Array<{ url; internalPath; status; headers }> }

declare global {
  interface Window {
    __bridge_asset: (payloadJson: string) => void
    __bridge_done: (metaJson: string) => void
    __PACK_URL: string
    __MANIFEST: {
      assets: Array<{ url: string; internalPath: string; status: number; headers: Record<string, string> }>
    }
  }
}

const MAGIC_LEN = 4
const HEADER_LEN = 8
const PATH_LEN_FIELD = 2
const CONTENT_LEN_FIELD = 4

function bytesToBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!)
  return btoa(s)
}

async function main(): Promise<void> {
  const packUrl = window.__PACK_URL
  const manifest = window.__MANIFEST
  const byInternalPath = new Map(manifest.assets.map(a => [a.internalPath, a]))

  const resp = await fetch(packUrl)
  const buf = await resp.arrayBuffer()
  const data = new Uint8Array(buf)

  const magic = new TextDecoder().decode(data.subarray(0, MAGIC_LEN))
  if (magic !== 'CART') throw new Error('Pack is not CART format')

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const count = view.getUint32(4, false)
  let offset = HEADER_LEN
  let emitted = 0
  let totalBytes = 0

  const decoder = new TextDecoder('utf-8')
  for (let i = 0; i < count; i++) {
    const pathLen = view.getUint16(offset, false); offset += PATH_LEN_FIELD
    const internalPath = decoder.decode(data.subarray(offset, offset + pathLen)); offset += pathLen
    const contentLen = view.getUint32(offset, false); offset += CONTENT_LEN_FIELD
    const bytes = data.subarray(offset, offset + contentLen); offset += contentLen

    const entry = byInternalPath.get(internalPath)
    if (!entry) continue
    window.__bridge_asset(JSON.stringify({
      url: entry.url,
      status: entry.status,
      headers: entry.headers,
      bytesB64: bytesToBase64(bytes)
    }))
    emitted++
    totalBytes += contentLen
  }

  window.__bridge_done(JSON.stringify({ count: emitted, totalBytes }))
}

void main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('[bridge] bootstrap failed', err)
})

export {}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/browser/bootstrap.ts
git commit -m "feat(replay-harness): browser bootstrap that fetches and parses CART pack"
```

---

### Task 3.2: Bundle bootstrap with esbuild

**Files:**
- Create: `packages/replay-harness/src/browser/build-bootstrap.ts`

- [ ] **Step 1: Write build-bootstrap.ts**

```typescript
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

export async function bundleBootstrap(): Promise<string> {
  const result = await build({
    entryPoints: [resolve(here, 'bootstrap.ts')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    write: false,
    minify: false
  })
  const out = result.outputFiles[0]
  if (!out) throw new Error('esbuild produced no output')
  return out.text
}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/browser/build-bootstrap.ts
git commit -m "feat(replay-harness): esbuild bundler for the bootstrap"
```

---

### Task 3.3: Bridge class (Node side)

**Files:**
- Create: `packages/replay-harness/src/replay/bridge.ts`

- [ ] **Step 1: Write bridge.ts**

```typescript
import type { BrowserContext, CDPSession, Page } from 'playwright'

export interface BridgeAsset {
  url: string
  status: number
  headers: Record<string, string>
  bytes: Uint8Array
}

export interface BridgeStats {
  emitted: number
  totalBytes: number
  doneAt: number | null
}

export class Bridge {
  private readonly waiters = new Map<string, ((asset: BridgeAsset) => void)[]>()
  private readonly cache = new Map<string, BridgeAsset>()
  private done = false
  readonly stats: BridgeStats = { emitted: 0, totalBytes: 0, doneAt: null }

  async install(context: BrowserContext): Promise<void> {
    await context.exposeBinding('__bridge_asset', (_source, payloadJson: string) => {
      const payload = JSON.parse(payloadJson) as { url: string; status: number; headers: Record<string, string>; bytesB64: string }
      const asset: BridgeAsset = {
        url: payload.url,
        status: payload.status,
        headers: payload.headers,
        bytes: Uint8Array.from(Buffer.from(payload.bytesB64, 'base64'))
      }
      this.cache.set(asset.url, asset)
      this.stats.emitted++
      this.stats.totalBytes += asset.bytes.byteLength

      const queue = this.waiters.get(asset.url)
      if (queue) {
        for (const resolve of queue) resolve(asset)
        this.waiters.delete(asset.url)
      }
    })

    await context.exposeBinding('__bridge_done', (_source) => {
      this.done = true
      this.stats.doneAt = performance.now()
    })
  }

  /** Inject pack URL + manifest subset into the page right before bootstrap runs. */
  async bootstrap(page: Page, packUrl: string, manifestSubset: { assets: Array<{ url: string; internalPath: string; status: number; headers: Record<string, string> }> }, bootstrapBundle: string): Promise<void> {
    await page.addInitScript({ content: `window.__PACK_URL=${JSON.stringify(packUrl)};window.__MANIFEST=${JSON.stringify(manifestSubset)};` })
    await page.addInitScript({ content: bootstrapBundle })
  }

  /** Wait for an asset by URL. Resolves immediately if already cached, else when emitted. */
  async waitFor(url: string, timeoutMs: number): Promise<BridgeAsset | null> {
    const cached = this.cache.get(url)
    if (cached) return cached
    if (this.done) return null

    return await new Promise<BridgeAsset | null>(resolve => {
      const timer = setTimeout(() => {
        const queue = this.waiters.get(url)
        if (queue) {
          const idx = queue.indexOf(resolve as never)
          if (idx >= 0) queue.splice(idx, 1)
        }
        resolve(null)
      }, timeoutMs)

      const wrap = (asset: BridgeAsset) => { clearTimeout(timer); resolve(asset) }
      const queue = this.waiters.get(url) ?? []
      queue.push(wrap)
      this.waiters.set(url, queue)
    })
  }
}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/replay/bridge.ts
git commit -m "feat(replay-harness): browser↔node bridge for streaming asset delivery"
```

---

### Task 3.4: Bridge-mode TokenPack replayer (replaces local mode)

**Files:**
- Create: `packages/replay-harness/src/replay/tokenpack.ts`

- [ ] **Step 1: Write tokenpack.ts**

```typescript
import { chromium } from 'playwright'
import type { TargetConfig, ThrottleConfig, PackManifest } from '../config/types.js'
import { runJourney } from '../record/journey.js'
import { applyThrottle } from './throttle.js'
import { loadManifest } from './manifest-loader.js'
import { Bridge } from './bridge.js'
import { bundleBootstrap } from '../browser/build-bootstrap.js'
import { logger } from '../log/logger.js'

export interface TokenpackResult {
  durationMs: number
  loadEventMs: number | null
  served: number
  fellThrough: number
  emitted: number
  totalBytes: number
}

export interface TokenpackOptions {
  throttle?: ThrottleConfig
  storageStatePath?: string
  extraHeaders?: Record<string, string>
  packUrl: string                                 // CDN URL or http://127.0.0.1:port/pack
  manifestPath: string
  fulfillTimeoutMs?: number                       // default 30000
}

export async function runTokenpack(target: TargetConfig, options: TokenpackOptions): Promise<TokenpackResult> {
  const manifest: PackManifest = await loadManifest(options.manifestPath)
  const byUrl = new Map(manifest.assets.map(a => [a.url, a]))
  const bootstrap = await bundleBootstrap()

  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      storageState: options.storageStatePath
    })
    if (options.extraHeaders) {
      await context.setExtraHTTPHeaders(options.extraHeaders)
    }
    const bridge = new Bridge()
    await bridge.install(context)

    const page = await context.newPage()
    const client = await context.newCDPSession(page)

    if (options.throttle) await applyThrottle(client, options.throttle)

    await bridge.bootstrap(
      page,
      options.packUrl,
      { assets: manifest.assets.map(a => ({ url: a.url, internalPath: a.internalPath, status: a.status, headers: a.headers as Record<string, string> })) },
      bootstrap
    )

    let served = 0
    let fellThrough = 0
    const fulfillTimeoutMs = options.fulfillTimeoutMs ?? 30_000

    await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
    client.on('Fetch.requestPaused', async (event) => {
      const entry = byUrl.get(event.request.url)
      if (!entry) {
        fellThrough++
        await client.send('Fetch.continueRequest', { requestId: event.requestId })
        return
      }
      const asset = await bridge.waitFor(event.request.url, fulfillTimeoutMs)
      if (!asset) {
        fellThrough++
        logger.warn({ url: event.request.url }, 'bridge wait timeout — falling through')
        await client.send('Fetch.continueRequest', { requestId: event.requestId })
        return
      }
      served++
      await client.send('Fetch.fulfillRequest', {
        requestId: event.requestId,
        responseCode: asset.status,
        responseHeaders: Object.entries(asset.headers).map(([name, value]) => ({ name, value })),
        body: Buffer.from(asset.bytes).toString('base64')
      })
    })

    let loadEventMs: number | null = null
    page.on('load', () => { loadEventMs = performance.now() - started })

    const started = performance.now()
    await page.goto(target.url, { waitUntil: 'load' })
    await runJourney(page, target.journey)
    await page.waitForLoadState('networkidle')
    const durationMs = performance.now() - started

    logger.info({ mode: 'tokenpack', durationMs, loadEventMs, served, fellThrough, ...bridge.stats }, 'tokenpack run complete')
    return {
      durationMs,
      loadEventMs,
      served,
      fellThrough,
      emitted: bridge.stats.emitted,
      totalBytes: bridge.stats.totalBytes
    }
  } finally {
    await browser.close()
  }
}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/replay/tokenpack.ts
git commit -m "feat(replay-harness): bridge-mode tokenpack replayer with streaming-decode-on-arrival"
```

---

### Task 3.5: Integration test — bridge replay round-trip

**Files:**
- Create: `packages/replay-harness/test/integration/record-encode-bridge-replay.test.ts`
- Modify: `packages/replay-harness/test/integration/fixture-server.ts` (extend to also serve a CART pack file)

- [ ] **Step 1: Extend fixture-server.ts to serve packs**

Replace the file contents with:

```typescript
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface FixtureServer {
  url: string
  serveFile: (path: string, mime: string, bytes: Uint8Array) => void
  close: () => Promise<void>
}

export async function startFixtureServer(): Promise<FixtureServer> {
  const html = `<!doctype html><html><head>
    <link rel="stylesheet" href="/a.css">
    <script src="/b.js" defer></script>
    </head><body>fixture</body></html>`
  const css = 'body{background:#eef}'
  const js = 'window.__loaded=true'

  const extraFiles = new Map<string, { mime: string; bytes: Uint8Array }>()

  const server: Server = createServer((req, res) => {
    const path = req.url ?? '/'
    const extra = extraFiles.get(path)
    if (extra) {
      res.writeHead(200, { 'content-type': extra.mime, 'cache-control': 'public,max-age=60' })
      res.end(Buffer.from(extra.bytes))
      return
    }
    if (path === '/' || path === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-cache' })
      res.end(html)
    } else if (path === '/a.css') {
      res.writeHead(200, { 'content-type': 'text/css', 'cache-control': 'public,max-age=60' })
      res.end(css)
    } else if (path === '/b.js') {
      res.writeHead(200, { 'content-type': 'application/javascript', 'cache-control': 'public,max-age=60' })
      res.end(js)
    } else {
      res.writeHead(404).end()
    }
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port

  return {
    url: `http://127.0.0.1:${port}/`,
    serveFile: (path, mime, bytes) => extraFiles.set(path, { mime, bytes }),
    close: () => new Promise<void>((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve()))
  }
}
```

- [ ] **Step 2: Write the bridge-replay integration test**

```typescript
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { record } from '../../src/record/recorder.js'
import { encode } from '../../src/encode/encoder.js'
import { runTokenpack } from '../../src/replay/tokenpack.js'
import type { TargetConfig } from '../../src/config/types.js'
import { startFixtureServer, type FixtureServer } from './fixture-server.js'

let server: FixtureServer
let tmp: string

beforeAll(async () => {
  server = await startFixtureServer()
  tmp = mkdtempSync(join(tmpdir(), 'replay-harness-bridge-'))
})

afterAll(async () => {
  await server.close()
  rmSync(tmp, { recursive: true, force: true })
})

it('streams pack via browser fetch and serves all sub-resources', async () => {
  const target: TargetConfig = {
    id: 'fixture',
    url: server.url,
    journey: { type: 'goto-only' },
    authMode: 'none',
    captureGraceMs: 500
  }

  const recorded = await record(target)
  const out = await encode(target.id, recorded.assets, tmp)

  // Host the pack on the same fixture server so the browser fetch is real
  const packBytes = readFileSync(out.packPath)
  server.serveFile('/pack.cart', 'application/octet-stream', new Uint8Array(packBytes))
  const packUrl = `${server.url}pack.cart`

  const result = await runTokenpack(target, {
    packUrl,
    manifestPath: out.manifestPath
  })

  expect(result.served).toBe(recorded.assets.length)
  expect(result.fellThrough).toBe(1)              // HTML doc
  expect(result.emitted).toBe(recorded.assets.length)
}, 90_000)
```

- [ ] **Step 3: Run the integration test**

Run: `yarn workspace tokenpack-replay-harness test record-encode-bridge-replay`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/replay-harness/test/integration/
git commit -m "test(replay-harness): bridge-replay end-to-end integration test"
```

---

## Phase 4 — CDN upload + throttle wired in

### Task 4.1: S3-compatible uploader

**Files:**
- Create: `packages/replay-harness/src/upload/s3-uploader.ts`

- [ ] **Step 1: Write s3-uploader.ts**

```typescript
import { readFile } from 'node:fs/promises'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { logger } from '../log/logger.js'

export interface UploadConfig {
  endpoint: string                              // e.g. https://<acct>.r2.cloudflarestorage.com
  region: string                                // 'auto' for R2
  bucket: string
  publicBaseUrl: string                         // e.g. https://pub-<id>.r2.dev
  accessKeyId: string
  secretAccessKey: string
}

export function uploadConfigFromEnv(): UploadConfig {
  const need = (k: string): string => {
    const v = process.env[k]
    if (!v) throw new Error(`Missing env: ${k}`)
    return v
  }
  return {
    endpoint: need('REPLAY_UPLOAD_ENDPOINT'),
    region: process.env.REPLAY_UPLOAD_REGION ?? 'auto',
    bucket: need('REPLAY_UPLOAD_BUCKET'),
    publicBaseUrl: need('REPLAY_UPLOAD_PUBLIC_BASE'),
    accessKeyId: need('REPLAY_UPLOAD_ACCESS_KEY'),
    secretAccessKey: need('REPLAY_UPLOAD_SECRET_KEY')
  }
}

export async function uploadPack(
  config: UploadConfig,
  packPath: string,
  objectKey: string
): Promise<string> {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    forcePathStyle: true
  })

  const body = await readFile(packPath)

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    Body: body,
    ContentType: 'application/octet-stream',
    CacheControl: 'public, max-age=300'
  }))

  const publicUrl = `${config.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`
  logger.info({ publicUrl, bytes: body.byteLength }, 'pack uploaded')
  return publicUrl
}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/upload/s3-uploader.ts
git commit -m "feat(replay-harness): S3-compatible pack uploader"
```

---

### Task 4.2: `upload` script

**Files:**
- Create: `packages/replay-harness/bin/upload.ts`

- [ ] **Step 1: Write bin/upload.ts**

```typescript
import { readFile, writeFile } from 'node:fs/promises'
import type { PackManifest } from '../src/config/types.js'
import { uploadConfigFromEnv, uploadPack } from '../src/upload/s3-uploader.js'
import { publicDemo } from '../src/config/targets/public-demo.js'
import { logger } from '../src/log/logger.js'

const targetId = process.argv[2] ?? 'public-demo'
const targets = { 'public-demo': publicDemo } as const
const target = targets[targetId as keyof typeof targets]
if (!target) {
  logger.error({ targetId }, 'unknown target')
  process.exit(1)
}

const packPath = `fixtures/${target.id}/${target.id}.cart`
const manifestPath = `fixtures/${target.id}/${target.id}.manifest.json`

const config = uploadConfigFromEnv()
const objectKey = `${target.id}/${Date.now()}-main.cart`
const publicUrl = await uploadPack(config, packPath, objectKey)

const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as PackManifest
const updated: PackManifest = {
  ...manifest,
  packs: manifest.packs.map(p => p.id === 'main' ? { ...p, url: publicUrl } : p)
}
await writeFile(manifestPath, JSON.stringify(updated, null, 2), 'utf8')

logger.info({ publicUrl, manifestPath }, 'manifest updated with public URL')
```

- [ ] **Step 2: Verify type-check and commit**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

```bash
git add packages/replay-harness/bin/upload.ts
git commit -m "feat(replay-harness): upload script"
```

---

### Task 4.3: Throttle presets

**Files:**
- Create: `packages/replay-harness/src/config/throttles.ts`

- [ ] **Step 1: Write throttles.ts**

```typescript
import type { ThrottleConfig } from './types.js'

export const NONE: ThrottleConfig = {
  downloadKbps: 1_000_000,
  uploadKbps: 1_000_000,
  rttMs: 0,
  cpuSlowdownFactor: 1
}

export const FAST_4G: ThrottleConfig = {
  downloadKbps: 9_000,
  uploadKbps: 1_500,
  rttMs: 170,
  cpuSlowdownFactor: 1
}

export const REGULAR_4G: ThrottleConfig = {
  downloadKbps: 4_000,
  uploadKbps: 750,
  rttMs: 200,
  cpuSlowdownFactor: 1
}

export const REGULAR_3G: ThrottleConfig = {
  downloadKbps: 1_600,
  uploadKbps: 750,
  rttMs: 300,
  cpuSlowdownFactor: 4
}

export const PRESETS: Readonly<Record<string, ThrottleConfig>> = Object.freeze({
  NONE,
  FAST_4G,
  REGULAR_4G,
  REGULAR_3G
})
```

- [ ] **Step 2: Commit**

```bash
git add packages/replay-harness/src/config/throttles.ts
git commit -m "feat(replay-harness): named throttle presets"
```

---

### Task 4.4: Integration test — throttle applies to baseline and tokenpack runs

**Files:**
- Create: `packages/replay-harness/test/integration/throttle-applies.test.ts`

- [ ] **Step 1: Write throttle-applies.test.ts**

```typescript
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { record } from '../../src/record/recorder.js'
import { encode } from '../../src/encode/encoder.js'
import { runBaseline } from '../../src/replay/baseline.js'
import { runTokenpack } from '../../src/replay/tokenpack.js'
import type { TargetConfig } from '../../src/config/types.js'
import { startFixtureServer, type FixtureServer } from './fixture-server.js'

let server: FixtureServer
let tmp: string

beforeAll(async () => {
  server = await startFixtureServer()
  tmp = mkdtempSync(join(tmpdir(), 'replay-harness-throttle-'))
})

afterAll(async () => {
  await server.close()
  rmSync(tmp, { recursive: true, force: true })
})

const target: TargetConfig = {
  id: 'fixture',
  url: '',
  journey: { type: 'goto-only' },
  authMode: 'none',
  captureGraceMs: 500
}

it('throttle increases baseline duration', async () => {
  const t = { ...target, url: server.url }
  const fast = await runBaseline(t)
  const slow = await runBaseline(t, {
    throttle: { downloadKbps: 100, uploadKbps: 50, rttMs: 500, cpuSlowdownFactor: 1 }
  })
  expect(slow.durationMs).toBeGreaterThan(fast.durationMs * 1.5)
}, 60_000)

it('throttle applies in tokenpack mode (pack download is over the wire)', async () => {
  const t = { ...target, url: server.url }
  const recorded = await record(t)
  const out = await encode(t.id, recorded.assets, tmp)
  const packBytes = readFileSync(out.packPath)
  server.serveFile('/pack.cart', 'application/octet-stream', new Uint8Array(packBytes))
  const packUrl = `${server.url}pack.cart`

  const fast = await runTokenpack(t, { packUrl, manifestPath: out.manifestPath })
  const slow = await runTokenpack(t, {
    packUrl,
    manifestPath: out.manifestPath,
    throttle: { downloadKbps: 100, uploadKbps: 50, rttMs: 500, cpuSlowdownFactor: 1 }
  })
  expect(slow.durationMs).toBeGreaterThan(fast.durationMs * 1.5)
}, 120_000)
```

- [ ] **Step 2: Run the integration test**

Run: `yarn workspace tokenpack-replay-harness test throttle-applies`
Expected: PASS.

If localhost is exempt from CDP throttle (untested as of this plan — see spec Risk #2), this test will fail. Mitigation: route the localhost host header through a known external test endpoint, or update the spec to acknowledge that throttle is only verified for non-localhost destinations.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/test/integration/throttle-applies.test.ts
git commit -m "test(replay-harness): verify CDP throttle applies in both modes"
```

---

## Phase 5 — Reporter, CSV, benchmark orchestrator

### Task 5.1: Timings collector

**Files:**
- Create: `packages/replay-harness/src/replay/timings.ts`

- [ ] **Step 1: Write timings.ts**

```typescript
import type { CDPSession } from 'playwright'

export interface TimingSnapshot {
  navigationStartMs: number
  domContentLoadedMs: number | null
  loadEventMs: number | null
  firstContentfulPaintMs: number | null
  totalBlockingTimeMs: number | null
}

export async function collectTimings(client: CDPSession): Promise<TimingSnapshot> {
  const { metrics } = await client.send('Performance.getMetrics')
  const get = (name: string): number | null => {
    const m = metrics.find(x => x.name === name)
    return m ? m.value * 1000 : null      // CDP metrics are seconds; we report ms
  }

  return {
    navigationStartMs: 0,
    domContentLoadedMs: get('DomContentLoaded'),
    loadEventMs: get('Load'),
    firstContentfulPaintMs: get('FirstContentfulPaint'),
    totalBlockingTimeMs: null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/replay-harness/src/replay/timings.ts
git commit -m "feat(replay-harness): per-run timings collector"
```

---

### Task 5.2: CSV writer (TDD)

**Files:**
- Create: `packages/replay-harness/test/unit/csv.test.ts`
- Create: `packages/replay-harness/src/report/csv.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest'
import { rowsToCsv } from '../../src/report/csv.js'

describe('rowsToCsv', () => {
  it('emits a header row and data rows', () => {
    const csv = rowsToCsv([
      { mode: 'baseline', durationMs: 1234.5, served: 0, fellThrough: 0 },
      { mode: 'tokenpack', durationMs: 987.2, served: 12, fellThrough: 1 }
    ])
    expect(csv).toBe(
      'mode,durationMs,served,fellThrough\n' +
      'baseline,1234.5,0,0\n' +
      'tokenpack,987.2,12,1\n'
    )
  })

  it('escapes commas and quotes in values', () => {
    const csv = rowsToCsv([{ note: 'a,b "c"', n: 1 }])
    expect(csv).toBe('note,n\n"a,b ""c""",1\n')
  })

  it('handles null and undefined as empty', () => {
    const csv = rowsToCsv([{ a: null, b: undefined, c: 3 }])
    expect(csv).toBe('a,b,c\n,,3\n')
  })

  it('returns empty string for empty input', () => {
    expect(rowsToCsv([])).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace tokenpack-replay-harness test csv`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
type Cell = string | number | boolean | null | undefined

function escape(v: Cell): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function rowsToCsv(rows: ReadonlyArray<Readonly<Record<string, Cell>>>): string {
  if (rows.length === 0) return ''
  const cols = Object.keys(rows[0]!)
  const header = cols.join(',') + '\n'
  const body = rows.map(r => cols.map(c => escape(r[c])).join(',')).join('\n') + '\n'
  return header + body
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace tokenpack-replay-harness test csv`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/replay-harness/src/report/csv.ts packages/replay-harness/test/unit/csv.test.ts
git commit -m "feat(replay-harness): CSV writer"
```

---

### Task 5.3: Benchmark orchestrator

**Files:**
- Create: `packages/replay-harness/src/replay/orchestrator.ts`

- [ ] **Step 1: Write orchestrator.ts**

```typescript
import { writeFile } from 'node:fs/promises'
import type { BenchmarkConfig, PackManifest } from '../config/types.js'
import { runBaseline } from './baseline.js'
import { runTokenpack } from './tokenpack.js'
import { rowsToCsv } from '../report/csv.js'
import { loadManifest } from './manifest-loader.js'
import { logger } from '../log/logger.js'

interface RunRow extends Record<string, string | number | boolean | null | undefined> {
  iter: number
  mode: 'baseline' | 'tokenpack'
  targetId: string
  durationMs: number
  loadEventMs: number | null
  served: number | null
  fellThrough: number | null
  emitted: number | null
  totalBytes: number | null
}

export async function runBenchmark(config: BenchmarkConfig, manifestPath: string): Promise<string> {
  const manifest: PackManifest = await loadManifest(manifestPath)
  const mainPack = manifest.packs.find(p => p.id === 'main')
  if (!mainPack?.url) throw new Error('manifest.packs[main].url is missing — upload first')

  const rows: RunRow[] = []

  for (let warmup = 0; warmup < config.warmupRuns; warmup++) {
    logger.info({ iter: warmup }, 'warmup baseline')
    await runBaseline(config.target, { throttle: config.throttle })
    logger.info({ iter: warmup }, 'warmup tokenpack')
    await runTokenpack(config.target, { throttle: config.throttle, packUrl: mainPack.url, manifestPath })
  }

  for (let iter = 0; iter < config.samples; iter++) {
    logger.info({ iter, mode: 'baseline' }, 'sample')
    const b = await runBaseline(config.target, {
      throttle: config.throttle,
      storageStatePath: config.target.storageStatePath,
      extraHeaders: config.target.extraHeaders
    })
    rows.push({
      iter, mode: 'baseline', targetId: config.target.id,
      durationMs: b.durationMs, loadEventMs: b.loadEventMs,
      served: null, fellThrough: null, emitted: null, totalBytes: null
    })

    logger.info({ iter, mode: 'tokenpack' }, 'sample')
    const t = await runTokenpack(config.target, {
      throttle: config.throttle,
      packUrl: mainPack.url,
      manifestPath,
      storageStatePath: config.target.storageStatePath,
      extraHeaders: config.target.extraHeaders
    })
    rows.push({
      iter, mode: 'tokenpack', targetId: config.target.id,
      durationMs: t.durationMs, loadEventMs: t.loadEventMs,
      served: t.served, fellThrough: t.fellThrough, emitted: t.emitted, totalBytes: t.totalBytes
    })
  }

  const csv = rowsToCsv(rows)
  await writeFile(config.outputCsv, csv, 'utf8')
  logger.info({ outputCsv: config.outputCsv, rows: rows.length }, 'benchmark complete')
  return config.outputCsv
}
```

- [ ] **Step 2: Verify type-check**

Run: `yarn workspace tokenpack-replay-harness run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/src/replay/orchestrator.ts
git commit -m "feat(replay-harness): benchmark orchestrator with alternated samples"
```

---

### Task 5.4: `benchmark` script

**Files:**
- Create: `packages/replay-harness/bin/benchmark.ts`

- [ ] **Step 1: Write bin/benchmark.ts**

```typescript
import { runBenchmark } from '../src/replay/orchestrator.js'
import { publicDemo } from '../src/config/targets/public-demo.js'
import { PRESETS } from '../src/config/throttles.js'
import { BenchmarkConfigSchema } from '../src/config/types.js'
import { logger } from '../src/log/logger.js'

const targetId = process.argv[2] ?? 'public-demo'
const throttleName = process.argv[3] ?? 'FAST_4G'
const samples = Number(process.argv[4] ?? 10)

const targets = { 'public-demo': publicDemo } as const
const target = targets[targetId as keyof typeof targets]
if (!target) {
  logger.error({ targetId }, 'unknown target')
  process.exit(1)
}

const throttle = PRESETS[throttleName]
if (!throttle) {
  logger.error({ throttleName, available: Object.keys(PRESETS) }, 'unknown throttle preset')
  process.exit(1)
}

const config = BenchmarkConfigSchema.parse({
  target,
  throttle,
  samples,
  warmupRuns: 1,
  outputCsv: `results/${target.id}-${Date.now()}.csv`
})

const manifestPath = `fixtures/${target.id}/${target.id}.manifest.json`
const out = await runBenchmark(config, manifestPath)
logger.info({ out }, 'wrote CSV')
```

- [ ] **Step 2: Smoke run end-to-end**

Run:
```bash
yarn workspace tokenpack-replay-harness run record public-demo
yarn workspace tokenpack-replay-harness run upload public-demo
yarn workspace tokenpack-replay-harness run benchmark public-demo FAST_4G 5
```

Expected: all three succeed; CSV at `packages/replay-harness/results/public-demo-<ts>.csv` with 10 data rows (5 samples × 2 modes).

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/bin/benchmark.ts
git commit -m "feat(replay-harness): benchmark script"
```

---

## Phase 6 — Auth support

### Task 6.1: `login` script (interactive)

**Files:**
- Create: `packages/replay-harness/bin/login.ts`

- [ ] **Step 1: Write bin/login.ts**

```typescript
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { chromium } from 'playwright'
import { publicDemo } from '../src/config/targets/public-demo.js'
import { logger } from '../src/log/logger.js'

const targetId = process.argv[2] ?? 'public-demo'
const targets = { 'public-demo': publicDemo } as const
const target = targets[targetId as keyof typeof targets]
if (!target) {
  logger.error({ targetId }, 'unknown target')
  process.exit(1)
}

const storageStatePath = target.storageStatePath ?? `fixtures/${target.id}/storageState.json`
await mkdir(dirname(storageStatePath), { recursive: true })

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(target.url)

logger.info({ url: target.url }, 'log in manually in the browser window, then return here and press ENTER')

const rl = createInterface({ input: process.stdin, output: process.stdout })
await rl.question('Press ENTER once logged in to save state and close: ')
rl.close()

await context.storageState({ path: storageStatePath })
logger.info({ storageStatePath }, 'storageState saved')
await browser.close()
```

The flow is: launch headed Chromium → user logs in → user presses ENTER on the terminal → we save state from the still-alive context → close the browser. We must capture state BEFORE closing the browser; reversing the order would lose the session.

- [ ] **Step 2: Commit**

```bash
git add packages/replay-harness/bin/login.ts
git commit -m "feat(replay-harness): login script for storageState capture"
```

---

### Task 6.2: storageState load is already wired — verify and document

**Files:**
- Modify: `packages/replay-harness/README.md` (add auth section)

- [ ] **Step 1: Verify**

Read `packages/replay-harness/src/record/recorder.ts`, `src/replay/baseline.ts`, `src/replay/tokenpack.ts` — confirm each accepts `storageStatePath` and threads it into `chromium.launch().newContext({ storageState })`. (These were added during Phases 1–3.) If any path is missing, add it.

- [ ] **Step 2: Append auth section to README.md**

```markdown
## Auth

Two mechanisms are supported.

### storageState (cookies + localStorage)

```bash
yarn workspace tokenpack-replay-harness run login <target>
```

Opens a headed Chromium pointed at `target.url`. Log in manually, then close the window. The harness writes `storageState.json` to `fixtures/<target>/storageState.json`. Subsequent `record` and `benchmark` runs read it automatically.

### Extra HTTP headers

For targets that need a static `Authorization` header or similar, set `extraHeaders` on the `TargetConfig`. Values are merged via `context.setExtraHTTPHeaders` and applied to all outgoing requests for the run.

### Security

- Captured pack files are uploaded to the configured S3 bucket. Header scrubbing (allowlist in `src/encode/header-scrubber.ts`) strips `Set-Cookie`, `Authorization` echo, and any header not on the allowlist before bytes are written. Verify the allowlist matches your target before running against a private endpoint.
- `storageState.json` is gitignored under `fixtures/`.
```

- [ ] **Step 3: Commit**

```bash
git add packages/replay-harness/README.md
git commit -m "docs(replay-harness): document auth mechanisms"
```

---

### Task 6.3: Auth smoke test on a known authed endpoint

**Files:**
- Modify: `packages/replay-harness/test/integration/fixture-server.ts` (extend with a basic-auth route)
- Create: `packages/replay-harness/test/integration/auth-smoke.test.ts`

- [ ] **Step 1: Extend fixture-server.ts with basic-auth route**

Add this branch to the request handler in `fixture-server.ts`:

```typescript
if (path === '/private/index.html') {
  const auth = req.headers.authorization
  if (auth !== 'Basic dXNlcjpwYXNz') {            // user:pass in base64
    res.writeHead(401, { 'www-authenticate': 'Basic' }).end('unauthorized')
    return
  }
  res.writeHead(200, { 'content-type': 'text/html' })
  res.end('<!doctype html><html><head><script src="/b.js"></script></head><body>private</body></html>')
  return
}
```

- [ ] **Step 2: Write auth-smoke.test.ts**

```typescript
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { record } from '../../src/record/recorder.js'
import { encode } from '../../src/encode/encoder.js'
import { runTokenpack } from '../../src/replay/tokenpack.js'
import type { TargetConfig } from '../../src/config/types.js'
import { startFixtureServer, type FixtureServer } from './fixture-server.js'

let server: FixtureServer
let tmp: string

beforeAll(async () => {
  server = await startFixtureServer()
  tmp = mkdtempSync(join(tmpdir(), 'replay-harness-auth-'))
})

afterAll(async () => {
  await server.close()
  rmSync(tmp, { recursive: true, force: true })
})

it('records and replays a basic-auth-protected page using extraHeaders', async () => {
  const target: TargetConfig = {
    id: 'fixture-private',
    url: `${server.url}private/index.html`,
    journey: { type: 'goto-only' },
    authMode: 'extraHeaders',
    extraHeaders: { Authorization: 'Basic dXNlcjpwYXNz' },
    captureGraceMs: 500
  }

  const recorded = await record(target, { extraHeaders: target.extraHeaders })
  expect(recorded.assets.length).toBeGreaterThanOrEqual(1)

  const out = await encode(target.id, recorded.assets, tmp)
  const packBytes = readFileSync(out.packPath)
  server.serveFile('/pack.cart', 'application/octet-stream', new Uint8Array(packBytes))

  const result = await runTokenpack(target, {
    packUrl: `${server.url}pack.cart`,
    manifestPath: out.manifestPath,
    extraHeaders: target.extraHeaders
  })
  expect(result.served).toBeGreaterThanOrEqual(1)
}, 60_000)
```

- [ ] **Step 3: Run the test**

Run: `yarn workspace tokenpack-replay-harness test auth-smoke`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/replay-harness/test/integration/
git commit -m "test(replay-harness): auth smoke test with extraHeaders"
```

---

## Plan summary

After all phases:

- ✅ Package `tokenpack-replay-harness` registered, builds, lints, tests.
- ✅ `record` produces a CART pack + manifest from any target with cookie/header auth.
- ✅ `upload` ships the pack to S3-compatible storage and updates the manifest URL.
- ✅ `benchmark` runs alternated baseline/tokenpack samples under matched throttle, emits a CSV.
- ✅ `login` saves storageState for authed targets.
- ✅ Three integration tests cover: local round-trip, bridge round-trip, throttle-applies, auth smoke.

Phase 7 (diff scenario) is a separate plan — it consumes a working pack from this plan and adds: capture v2 → `@tokenpack/core/diff-pack` to compute delta → ship delta over wire → apply on top of cached v1 → measure update-load.
