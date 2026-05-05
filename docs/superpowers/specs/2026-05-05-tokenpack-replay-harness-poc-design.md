# TokenPack Replay Harness — POC Design

**Date:** 2026-05-05
**Status:** Draft, awaiting review
**Owner:** Valerii Sorokobatko

## Purpose

Build a measurement instrument that tests the TokenPack-as-bundle-delivery hypothesis on real, large, multi-microfrontend web applications **without modifying their build, CI, or runtime code**.

The instrument must be target-agnostic — point it at any URL, get reproducible numbers comparing baseline page load against TokenPack-served page load.

## Hypothesis

For a real app's page load, TokenPack's structural advantage is:

1. **N→1 connection setup** — one streaming pack fetch replaces hundreds of small fetches with their TLS/TCP slow-start overhead.
2. **Bandwidth saturation** — one big stream uses available bandwidth more fully than many small ones with per-connection ramp-up.
3. **No request waterfall** — assets the app would only discover after parsing earlier scripts are already in flight inside the pack.
4. **Diff-versioning on update** — between releases, ship only a delta pack instead of the full asset graph.

The POC measures whether (1)-(3) actually win for cold load and (4) wins for update load.

## Non-goals

- Not a production rollout. Not a browser extension. Not an A/B test against real users.
- Not a faster compression algorithm — compression is brotli/deflate; PNG is the carrier.
- Not changing the target app's build, CI, or runtime.
- Not measuring HMR, dev workflows, or first-byte HTML latency (we instrument what comes after `goto`).
- Not claiming wins where TokenPack doesn't have a structural advantage (e.g., already-bundled apps over HTTP/2).

## What "POC succeeded" looks like

Both deliverables, in order:

1. **CSV report** — for a chosen target, ≥10 alternated samples each of baseline and TokenPack mode under matched throttle, with timing metrics (TTFB, time-to-first-script-executed, time-to-network-idle, `load` event).
2. **Live demo** — same harness can replay a real prod page in a real Chromium window for stakeholder demos.

Honest negative results count as success. The point is a credible answer, not a positive answer.

## High-level architecture

```
┌─────────────────── Playwright (Node) ─────────────────────┐
│  - Launches real Chromium                                  │
│  - Applies CDP throttle: same for baseline and replay      │
│  - Listens to Fetch.requestPaused for every browser req    │
│  - Holds the manifest:  url → "in pack X" or "miss"        │
│  - Bridges decoded bytes from browser back into fulfill    │
│  - Emits timing CSVs                                       │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼  (drives real browser via CDP)
┌─────────────────── Chromium ───────────────────────────────┐
│  - Runs the actual target app                              │
│  - Throttle applies to ALL outgoing requests browser-side  │
│  - Injected bootstrap fetches the pack via browser fetch   │
│  - Streams pack through @tokenpack/browser decoder         │
│  - Sends each emitted asset back to Node via Runtime       │
│    binding so Node can fulfill the intercepted request     │
└────────────────────────────────────────────────────────────┘
```

The pack lives at a real CDN URL. Its fetch travels the same throttled wire as everything else. CDP throttle is browser-wide, so we don't have to simulate the wire ourselves.

## Run lifecycle

```
─── ONCE PER APP VERSION ────────────────────────────────────

  CAPTURE  →  ENCODE  →  UPLOAD
  (slow, scripted user flow)         (artifacts: pack.png + manifest.json)

─── EACH BENCHMARK SESSION ──────────────────────────────────

  BASELINE_RUN  ↔  TOKENPACK_RUN     (alternated, fresh contexts, ~10× each)
        │                  │
        └─→ timings CSV ←──┘
```

Capture and benchmark are **separate runs**. The capture run produces artifacts; benchmark runs read those artifacts and time clean executions. Collapsing them would let capture overhead pollute baseline timings and unfairly favour TokenPack.

## Components

### 1. Recorder

Captures every GET response during a scripted journey.

```ts
page.on('response', async (resp) => {
  if (resp.request().method() !== 'GET') return;
  if (resp.status() >= 300) return;
  if (resp.headers()['cache-control']?.includes('no-store')) return;

  captured.push({
    url: resp.url(),
    seq: nextSeq++,
    status: resp.status(),
    headers: scrubHeaders(resp.headers()),  // see Security
    body: await resp.body(),
  });
});

await page.goto(target.url);
await runJourney(page, target.journey);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(target.captureGraceMs ?? 5000);
```

Output: `captured[]` ordered by arrival.

### 2. Encoder

```ts
captured.sort((a, b) => a.seq - b.seq);  // streaming order = consumption order

const packBytes = await tokenpackCore.encode(captured.map(c => ({
  path: sanitizeUrlToPath(c.url),
  bytes: c.body,
  meta: { headers: c.headers, status: c.status },
})));

const manifest = {
  version: 1,
  packs: [{ id: 'main', url: '<filled by uploader>' }],
  assets: captured.map(c => ({
    url: c.url,
    packId: 'main',
    internalPath: sanitizeUrlToPath(c.url),
    headers: c.headers,
    status: c.status,
  })),
};
```

**Pack chunking is `@tokenpack/core`'s concern.** If a logical pack exceeds the encoder's chunk threshold, it produces a multi-chunk pack internally. From the harness's perspective there is one logical pack accessed via `decode()`. The harness does not slice or reassemble.

### 3. Uploader

Pushes pack file(s) to a configured S3-compatible bucket (R2, S3, B2). Updates `manifest.json` with the public URL. Manifest stays local; pack bytes are public.

**Why a real CDN, not localhost:** the wire must be realistic for the streaming-overlap claim to mean anything. CDP `Network.emulateNetworkConditions` is reported to apply to localhost destinations in modern Chromium, but we verify this empirically in Phase 4 — and either way, a real CDN is closer to production reality and removes any ambiguity for skeptical readers of the report.

### 4. Replayer (Baseline mode)

```ts
await context.tracing.start({ snapshots: true, screenshots: true });
await applyThrottle(client, throttleConfig);
await page.goto(target.url);
await runJourney(page, target.journey);
await page.waitForLoadState('networkidle');
const timings = collectTimings(client);
```

Pure pass-through. No Fetch interception. Just throttle + journey + timings.

### 5. Replayer (TokenPack mode)

```ts
await applyThrottle(client, throttleConfig);
await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });

await page.addInitScript(bootstrapJs, { packUrl, manifestSubset });

client.on('Fetch.requestPaused', async ({ requestId, request }) => {
  const entry = manifest.assets.find(a => a.url === request.url);
  if (!entry) return client.send('Fetch.continueRequest', { requestId });

  const bytes = await waitForAssetFromBridge(request.url);
  await client.send('Fetch.fulfillRequest', {
    requestId,
    responseCode: entry.status,
    responseHeaders: toHeaderArray(entry.headers),
    body: bytes.toString('base64'),
  });
});

await page.goto(target.url);
await runJourney(page, target.journey);
```

The injected bootstrap (`bootstrapJs`) runs in the browser. It calls `fetch(packUrl)`, pipes the body through `@tokenpack/browser`'s streaming decoder, and on each emitted `{path, bytes}` looks up the corresponding URL via `manifestSubset` and forwards `(url, bytes)` back to Node via `Runtime.addBinding`.

**Why fetch happens in browser, not Node:** the pack fetch must travel the same throttled wire as the baseline. Node-side fetch would bypass the browser's throttle.

### 6. Reporter

Collects per-run timings via CDP `Performance.getMetrics`, `Page.loadEventFired`, custom marks, and Performance Observer entries injected into the page. Emits per-run rows to CSV with all conditions captured (mode, target, throttle, journey, timestamp).

## Auth handling

Many real apps require login. The harness supports two mechanisms:

### storageState (Playwright cookies + localStorage snapshot)

```bash
yarn workspace tokenpack-replay-harness run login --target wix-editor      # interactive login, saves storageState.json
yarn workspace tokenpack-replay-harness run record --target wix-editor     # uses saved state
yarn workspace tokenpack-replay-harness run benchmark --target wix-editor
```

`login` runs Playwright in headed mode, navigates to the target, lets the user log in manually, then dumps `context.storageState()` to disk. Subsequent runs pre-load that state into a fresh context.

### Per-target header overrides

For targets needing custom Authorization headers (bearer tokens for SPAs, internal headers for staging environments):

```ts
target.extraHeaders = { Authorization: 'Bearer <token>' };
context.setExtraHTTPHeaders(target.extraHeaders);
```

storageState files and header configs are gitignored. The repo ships only target definitions and journeys.

## Configuration shape

```ts
type TargetConfig = {
  id: string;                          // 'wix-editor', 'gmail', etc.
  url: string;                         // entry URL
  journey:                             // what to do after goto
    | { type: 'goto-only' }
    | { type: 'login-and-open'; selectors: { ... } }
    | { type: 'custom'; modulePath: string };
  authMode?: 'none' | 'storageState' | 'extraHeaders';
  storageStatePath?: string;           // gitignored
  extraHeaders?: Record<string, string>;
  captureGraceMs?: number;             // default 5000
  pack: {
    chunkingHint?: 'core-default';     // hand off to @tokenpack/core
    cdnUploadUrl?: string;             // where uploader pushes
  };
};

type BenchmarkConfig = {
  target: TargetConfig;
  throttle: {
    downloadKbps: number;
    uploadKbps: number;
    rttMs: number;
    cpuSlowdownFactor: number;
  };
  samples: number;                     // baseline + tokenpack each
  warmupRuns: number;                  // discarded
  outputCsv: string;
};
```

## Project layout

A **new, separate package** at `packages/replay-harness/`. Independent `package.json`, its own CLI, distributable on its own. Depends on `@tokenpack/core` and `@tokenpack/browser` (the latter for the in-browser streaming-decode bootstrap). Sits alongside other packages in the yarn workspace; deliberately *not* nested inside `runtime-experiments` because the two have different purposes — `runtime-experiments` hosts browser-side perf scenarios, this package is a Node-side tool that drives a real Chromium.

Package name: `tokenpack-replay-harness` (no `@tokenpack/` scope, matching the convention used by `tokenpack-claude-skill` for tools).

```
packages/replay-harness/                 ← new top-level package
  package.json                           (name: tokenpack-replay-harness)
  tsconfig.json
  README.md
  src/
    record/
      recorder.ts
      journey.ts
    encode/
      encoder.ts
      manifest.ts
      header-scrubber.ts
    upload/
      s3-uploader.ts
    replay/
      baseline.ts
      tokenpack.ts
      bridge.ts                          ← Node↔browser binding
    browser/
      bootstrap.ts                       ← bundled into single JS, injected
    report/
      timings.ts
      csv.ts
    config/
      targets/
        public-demo.ts                   (shipped example)
        private/                         (gitignored — real targets, login flows)
      throttles.ts
    cli.ts
  fixtures/
    .gitignore                           (ignore storageState.json, packs, manifests)
  bin/
    record.ts                            ← CLI: tokenpack-replay record
    encode.ts                            ← CLI: tokenpack-replay encode
    upload.ts                            ← CLI: tokenpack-replay upload
    benchmark.ts                         ← CLI: tokenpack-replay benchmark
    login.ts                             ← CLI: tokenpack-replay login
  results/
    <target>-<date>-<mode>.csv
  test/
    unit/
    integration/
```

The root `package.json` workspace list gets a new entry (`packages/replay-harness`). No changes to existing packages required for Phases 0–5; `@tokenpack/core` may grow per-file metadata support in Phase 1 (see Risks #4).

## Phased implementation

| Phase | Outcome |
|---|---|
| **0 — Skeleton** | New package `tokenpack-replay-harness` registered in the yarn workspace; TypeScript config; CLI entry; config plumbing. `yarn workspace tokenpack-replay-harness run cli --help` works. |
| **1 — Recorder + Encoder** | Capture a public, no-auth target end-to-end. Produces pack + manifest. Encoder stores headers as per-file metadata via `@tokenpack/core` (extending the API if needed). |
| **2 — Local replay round-trip** | Replay against the local file (no upload yet) just to validate the bridge wiring. Throttle off. |
| **3 — Browser bridge** | `addInitScript` bootstrap runs `@tokenpack/browser` streaming decode; `Runtime.addBinding` returns bytes to Node; `Fetch.fulfillRequest` serves them. |
| **4 — Real CDN upload + throttle** | Pack lives on R2/S3. Throttle applied. First credible run. |
| **5 — Reporter + CSV** | Timings collected, CSV emitted, multi-sample alternation. |
| **6 — Auth support** | `login` subcommand, storageState, header overrides. |
| **7 — Diff scenario** | Capture v2, compute diff via `@tokenpack/core`, replay update-load, measure. |

Phases 1-5 are the path to a first credible cold-load number. Phase 6 unlocks authed targets like Wix editor. Phase 7 unlocks the diff-versioning claim.

## Risks and open questions

1. **Determinism of captured assets.** Production apps serve different bytes per visit (a/b tests, feature flags, content-hashed URLs). Replay-time URLs may not match captured URLs → cache miss → fall through to origin. Strategy: accept some miss rate, log it in the CSV, exclude high-miss runs as outliers. Pin tests to fixed deploys when possible.

2. **CDP throttle interaction with `Fetch.fulfillRequest`.** When we fulfill a request from Node-side bytes, the browser's throttle should NOT apply — we're injecting bytes, not waiting for network. This is exactly the desired behaviour: we're modeling "asset is already available because the streaming pack delivered it." The pack's own download IS throttled (it's a real `fetch` from inside the browser), so the wire cost is paid where it actually lives. Verify in Phase 4.

3. **`Fetch.requestPaused` overhead.** Every intercepted request involves a CDP round-trip. With hundreds of requests this adds noise. Mitigation: use URL-pattern filtering (`patterns` field) to only pause requests we actually plan to handle.

4. **Header storage in pack.** `@tokenpack/core`'s current encode API stores file bytes; we need per-file metadata for HTTP response headers. Either: (a) extend encode to accept `meta`, (b) write a sidecar `__headers.json` inside the pack. Decision: (a) if the API is easy to extend, (b) otherwise. Resolve in Phase 1.

5. **Pack size at scale.** Real editors are 20-80MB compressed. PNG carrier is fine; streaming decoder must comfortably handle it. Test with progressive sizes during Phase 1.

6. **Security: do not leak auth.** Captured responses may contain `Set-Cookie`, `Authorization` echo, or other session-bearing headers. The encoder MUST scrub headers before packing. Strict allowlist: `Content-Type`, `Content-Encoding`, `Cache-Control`, `Etag`, `Last-Modified`, integrity hashes, source-map URLs. Anything else dropped. This is also why packs land on a private bucket by default unless the target was anonymous.

7. **Target-specific journey scripts may leak selectors.** Login flows reference DOM selectors. Targets with public URLs (e.g., `wix-editor.ts`) live in a gitignored `targets/private/` subdir; the public layout ships a `targets/public/` example with a no-auth demo site.

8. **`Fetch.continueRequest` for missed URLs vs the throttle.** Confirmed (in the design — must be tested in Phase 4) that fall-through requests still respect the browser's throttle.

## Testing strategy

- **Unit (per package)**: recorder filters, header scrubbing, manifest-builder, URL-to-path sanitizer.
- **Integration**: record → encode → replay round-trip on a small no-auth test page (a known static demo site we control). Asserts every captured URL is fulfilled from the pack on replay, no fall-throughs.
- **E2E benchmark**: a single end-to-end run on a chosen public target; results CSV generated; spot-check a row.

We don't aim for 80% coverage for browser-side bootstrap (mostly glue between APIs); we do aim for 80%+ on recorder, encoder, manifest, and bridge logic.

## Success criteria (for the POC, not the product)

- Can record any public site and produce a valid pack + manifest.
- Can replay and serve every captured URL via streaming decode (verified by zero unexpected fall-throughs on a deterministic target).
- Both modes report comparable, repeatable timings under matched throttle.
- For at least one chosen target, cold-load benchmark produces ≥10 valid samples per mode and a written interpretation: TokenPack faster / slower / no signal, with confidence based on variance.
- For at least one target, update-load benchmark with diff produces a comparable result with the same level of honesty.

## Appendix — what we're *not* committing to

- Any production rollout path.
- Any claim about apps that already ship optimally-bundled (we'll measure them, but we won't dress up losses as wins).
- Multi-pack chunking strategies as a feature of *this harness* — that is `@tokenpack/core`'s job.
- Stable CSV schema across phases (it'll evolve until we know what to measure).
