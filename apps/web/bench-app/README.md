# bench-app

Synthetic Wix-scale app for isolating TokenPack router, manifest-driven dynamic
files, bundle delivery, and native initial-HTML tags. Every scenario evaluates
the same requested JS, CSS, and image surface — only delivery differs. The point
is to reproduce the moat the Browser Fetch Bench shows (many small files in
parallel) inside an actual running page so we can compare cold load
like-for-like.

The generator and source live in `apps/web/bench-app`; generated fixtures are
static files under `apps/web/public/bench-app`.

## What it measures

Two phases — both timed:

1. **boot** — initial page load (eager bucket)
2. **lazy** — user clicks "Open 3D preview", a Three.js scene plus N extra
   plugin modules + stylesheets + textures load and render in a dialog

All loaders converge on the same end state per phase. Only delivery differs.

Five delivery paths compare the same requested app surface:

- **router**: TokenPack router path. `decodeRouter(router.png)` then
  `router.materialize(selectedPaths)` for JS, CSS, and images. The runtime
  range-fetches only the PNG chunk byte ranges needed for the selected paths.
- **multi**: manifest-driven many-file app. The loader fetches `manifest.json`,
  selects the requested paths, then dynamically injects one script/link/img
  request per selected file.
- **single**: manifest-driven bundle app. The loader fetches `manifest.json`,
  then loads `bundle.js` + `bundle.css` and selected image files. Partial
  runs still pay the full JS/CSS bundle because that is the scenario being
  measured.
- **native-chunks**: native initial-HTML chunks. The selected script/link/img
  tags are written directly into the initial HTML at build time; no runtime
  manifest request is made.
- **native-single**: native initial-HTML single bundle. The initial HTML has
  selected image/CSS tags plus one `entry-all.js`; partial runs still pay the
  full JS bundle because there is no granular JS delivery.

Default content shape (Wix-editor scale, ~40 MB total):

| Phase     | Kind       | Count | Per-file |   Total |
| --------- | ---------- | ----: | -------: | ------: |
| eager     | JS modules |   400 |    12 KB | ~4.8 MB |
| eager     | CSS files  |   100 |    10 KB |   ~1 MB |
| eager     | Small PNG  |   200 |    15 KB |   ~3 MB |
| eager     | Medium PNG |    50 |   190 KB | ~9.5 MB |
| eager     | Large PNG  |    10 |   1.5 MB |  ~15 MB |
| lazy      | three.js   |     1 |   ~600KB | ~600 KB |
| lazy      | JS plugins |    80 |    12 KB |   ~1 MB |
| lazy      | CSS files  |    30 |    10 KB | ~300 KB |
| lazy      | Small PNG  |    70 |    15 KB |   ~1 MB |
| lazy      | Medium PNG |    20 |   190 KB | ~3.8 MB |
| **total** |            |   961 |        — |  ~40 MB |

Two transports:

- **local**: same-origin from the local static server (pre-brotli on disk)
- **cdn**: S3-hosted base URL (use the upload script)

Boot signal: each loader fires `bench:boot:done` and sets
`window.__BENCH_BOOT_DONE = totalMs` when every module has been rendered.
Native HTML pages place `globalThis.__BENCH_START = performance.now()` before
any benchmark asset tags so parser-discovered script/link/img work is included
in boot timing. Dynamic pages use the same marker before the bootloader script.

Wire bytes: each runtime publishes `window.__BENCH_BYTES` (boot) and
`window.__BENCH_LAZY_BYTES` (lazy delta) from the Resource Timing API —
`{ requests, transferBytes, encodedBytes, decodedBytes }`, http(s) entries
plus the navigation document. The HTML shells raise the resource-timing
buffer to 20k entries before any asset loads (the 250-entry default silently
under-counts on the large fixture). Caveats:

- **Warm runs report ~0 transferBytes** — cache hits have no wire cost.
  That is signal, not a bug.
- **Cross-origin (CDN) responses report 0** unless the CDN sends
  `Timing-Allow-Origin`. Add that header in the upload script if CDN byte
  accounting matters.

## Build

```bash
yarn workspace tokenpack-web bench-app:modules     # 400 eager mod-NNNN.js
yarn workspace tokenpack-web bench-app:css         # 100 eager style-NNNN.css
yarn workspace tokenpack-web bench-app:images      # 260 eager img-*.png (3 buckets)
yarn workspace tokenpack-web bench-app:lazy        # lazy bucket + three.js bundle
yarn workspace tokenpack-web bench-app:bundle      # bundle.js + bundle.css + lazy.js + lazy.css
yarn workspace tokenpack-web bench-app:router      # one router with eager + lazy files
yarn workspace tokenpack-web bench-app:bootloader  # apps/web/public/bench-app/large/bootloader.js
yarn workspace tokenpack-web bench-app:compress    # .br + .gz siblings

# all of the above:
yarn workspace tokenpack-web bench-app:build

# HTML shells + runtime bundles only (all sizes + recompress) — use after
# changing bootloader/runtime/shell sources; skips asset/router regeneration:
yarn workspace tokenpack-web bench-app:shells

# same, one size:
BENCH_SIZE=large yarn workspace tokenpack-web bench-app:shells:size
```

Knobs at generation time:

```bash
yarn workspace tokenpack-web bench-app:modules --count=400 --size-kb=12
yarn workspace tokenpack-web bench-app:css     --count=100 --size-kb=10
yarn workspace tokenpack-web bench-app:images  --small=200 --medium=50 --large=10
```

## Run locally

```bash
yarn workspace tokenpack-web bench-app:serve
# open http://localhost:4173/bench-app/?loader=router
# or:    /bench-app/?loader=multi   /bench-app/?loader=single
```

## Bench (Playwright)

```bash
# local-only, 10 iters per case (no throttling — sub-second loads)
yarn workspace tokenpack-web bench-app:bench --iters=10 --origin=local

# realistic timing — throttle to "Fast 4G" or "Fast CDN":
yarn workspace tokenpack-web bench-app:bench --iters=10 --throttle=fast-4g
yarn workspace tokenpack-web bench-app:bench --iters=10 --throttle=fast-cdn

# add CDN cases:
yarn workspace tokenpack-web bench-app:upload                  # prints --cdn-base=...
# Regenerate native-single HTML with CDN-prefixed <img> and <script src>:
yarn workspace tokenpack-web bench-app:native-html --cdn-base=https://…/bench-app/<ts>
yarn workspace tokenpack-web bench-app:bench --iters=10 --cdn-base=https://…/bench-app/<ts>
```

The `--cdn-base` step before benching is only needed for `native-single`
(its asset URLs are baked into the HTML at build time so the browser can
parallel-fetch them during parse). The other four loaders read `cdnBase`
from the URL query string at runtime.

Throttle presets (Chrome DevTools-compatible):

| Preset     | Down      | Up        | Latency |
| ---------- | --------- | --------- | ------- |
| `none`     | unlimited | unlimited | 0 ms    |
| `fast-cdn` | 25 Mbps   | 5 Mbps    | 30 ms   |
| `fast-4g`  | 9 Mbps    | 1.5 Mbps  | 170 ms  |
| `slow-3g`  | 400 kbps  | 400 kbps  | 400 ms  |

Filter cases:

```bash
yarn workspace tokenpack-web bench-app:bench --only=router,multi
yarn workspace tokenpack-web bench-app:bench --origin=cdn
```

Output: a stdout table (boot/lazy medians + p95, wire bytes, request counts)
plus `apps/web/bench-app/results/bench-<ts>.json` with per-iteration samples.

The in-page UI at `/benchmarks/app` is the interactive companion: it has a
Repeats selector (1×/3×/5×) and reports the median with min–max spread plus
wire bytes per scenario. It always runs on your real network — throttled and
CDN numbers come from this CLI, which throttles via CDP.

## What to look for

If router beats multi-file on local cold by a meaningful margin (~30%+),
the moat reproduces and the Wix loss is a workload-shape problem, not a
fundamental router limitation. If router only ties multi-file even here,
that's a stronger statement about where the architecture wins and doesn't.
