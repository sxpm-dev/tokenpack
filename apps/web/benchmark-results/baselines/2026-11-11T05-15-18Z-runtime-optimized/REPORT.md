# Runtime performance improvements — 11 November 2026

Implemented and verified runtime improvements against `2026-11-11T04-45-56Z`. The original baseline is unchanged. This directory stores the full rerun, comparisons, source patch/hashes, verification logs and supplemental probes.

## What changed

- **Buffered Node/browser decoding:** reuse the image pixels obtained during algorithm detection instead of decoding the container a second time. Byte-sniffed/range algorithms retain their existing direct path. Browser typed-array inputs and deflate output avoid redundant copies; a single decompression output chunk is reused directly.
- **Shared PNG streaming:** queue fragmented input rather than repeatedly concatenate an incomplete PNG chunk. Wake consumers on data/completion instead of polling zero-delay timers. Propagate transport and truncation errors, cancel/release the source reader, and drain pending rows before completion. Slow-consumer and error tests cover this behavior.
- **Range fetching:** array text/blob reads coalesce adjacent requests, deduplicate paths, and retain requested result order. Fetches honor normal HTTP cache headers instead of always using `no-store`.
- **Browser router:** share pending and decoded file bytes across single, array, streaming and materialization calls. Failed work is evicted for retry. Chunk planning only handles uncached files.
- **Node router:** share file/chunk results across buffered, streaming and array access; evict rejected promises. The Node-only addition was measured separately because the main baseline matrix does not exercise Node router loading.

Formats and fixture payloads did not change. Caches belong to a router instance, not a global URL store. Reusing an instance retains decoded bytes until the instance becomes unreachable. Treat shared input/output byte views as immutable; use a new router for a changed artifact. Repeated materialization still performs DOM work.

## Verification and coverage

- **192 unit tests passed:** core 110, Node 56, browser 26. New regressions cover duplicate container decoding, fragmented streaming without timer polling, truncation and transport errors, slow consumers, grouped/duplicate file paths, and router reuse/retries.
- Library builds, browser bundle-safety check, production website build, and playground verification passed. The existing verification harness was corrected to accept both “Run bench” and “Re-run bench” after results have been saved.
- **300 static fetch rows**, **60 codec rows**, **60 encode measurements**, **15 archive timings**, and **20 unit operations** rerun.
- **683 playground runs:** 682 passed; the same high-entropy generated-script case failed in all six delivery variants. There were no new failed cases. Eighteen compatibility-gated scenario measurements remain skipped because Chromium does not support the required JavaScript Brotli stream constructor.
- **683/683 fixture fingerprints match** the baseline. Static source hashes also match. All **555 distinct saved configurations** read back with the correct results.
- Main suites ran sequentially on Node 22.16.0 / headless Chromium 147.0.7727.15. Static fetch uses all four presets; playgrounds use local networking, matching the baseline. App bootloaders were rebuilt so they include the new runtime.

## Measured changes

| Matched workload | Before | After | Interpretation |
|---|---:|---:|---|
| Node local 4.92 MB JS, linear-deflate C3 | 42.58 ms | 29.56 ms | 31% less time |
| Node local 4.92 MB JS, linear-WebP C3 | 32.06 ms | 21.45 ms | 33% less time |
| Whole-token JSON access, median across 409 paths | 5.90 ms | 4.50 ms | 24% less time |
| JSON range fetch, median across paths | 4.00 ms | 4.20 ms | Slightly slower; no demonstrated gain |
| JSON range stream, median across paths | 3.80 ms | 3.80 ms | Unchanged |
| Whole Brotli JSON control | 14.80 ms | 14.80 ms | Unchanged |
| 5,000 KB / 1% update, next full token | 19.80 ms | 13.80 ms | 30% less time |
| 5,000 KB / 1% update, apply diff | 2.60 ms | 2.00 ms | 23% less time |
| Small-module whole-pack fetch, text mode | 2.60 ms | 2.15 ms | 17% less time |
| Small-module partial fetch, text mode | 9.10 ms | 9.05 ms | Essentially unchanged |
| Large full app, cold router | 241.30 ms | 231.40 ms | 4% less time in this run |
| Large full app, warm router | 210.90 ms | 207.10 ms | 2% less time; essentially flat |

Across matching local sources, buffered linear-family fetch/decode has a median **1.40× speedup**. Native controls have a median 1.03× speedup. Linear streaming variants range from **1.22× to 1.41× median speedup**, depending on variant. Direct algorithm/codec timings and tpAK byte operations remain mostly unchanged: the main savings remove duplicate work around the codec rather than change its algorithm.

Browser whole-token fetch has **1.17×** median paired speedup for source content and **1.13×** for generated scripts; native Brotli controls are approximately flat. The stream-boot, inline-token and cache-token scenarios show roughly **1.21×, 1.24× and 1.30×** median paired speedups. At 5,120 KB, component multifile and subpack cases improved by approximately **1.50× and 1.43×**.

The diff matrix has **1.32×** median paired speedup for diff apply and **1.38×** for next-token delivery. Fresh app-router loading has only **1.02×** median paired speedup across 12 configurations. Some small warm-router configurations regressed (for example 16.3 → 19.4 ms for small/random/warm). These three-sample app results do not establish a reliable cold/warm app improvement; the repeated-instance cache should not be presented as one.

Delayed-network runs were noisier: native controls were about 8% slower in the fast/average presets. Overall token medians there were about 3–4% slower, while local buffered decoding improved. These runs do not support a universal network-latency claim. Complete per-case results, including slower cases, remain in `comparison.json`.

## Streaming regression check

One full-suite result was slower: local large-JS linear-stream-deflate C3 measured **24.47 → 31.08 ms**, with substantial variance. It was not discarded or replaced. Two alternating old/new probes investigated the change:

- Shared PNG surface, identical 16 KiB fragments: React fixture **2.49 → 1.39 ms**; large JS **13.41 → 12.16 ms**.
- Full public Node stream decode over local HTTP, including content/text materialization: large JS **27.72 → 25.55 ms**, p95 **38.63 → 38.02 ms**.

These probes use three warmups and 30 samples per implementation. They did not reproduce a persistent slowdown from the new stream surface. The original suite’s slower result remains evidence of variance, not proof that every streaming configuration became faster.

## Router reuse probe

For repeated `loadMany` of 12 already-loaded 100,000-byte files, Node router median changed from **0.416 ms to 0.0032 ms** (p95 **1.020 → 0.0050 ms**). The comparison alternates the old/new router implementations over the same current decode pipeline, with three warmups and 30 samples. It isolates the removal of repeated decompression and excludes initial load, networking and text conversion. Browser regression tests also prove repeated/concurrent array and stream reads issue no additional requests and failures can be retried.

This is a strong reuse improvement, not a claim of a 100× faster application. Fresh router creation in each app iframe does not reuse the previous instance’s decoded cache.

## Remaining issues

1. The high-entropy generated script still uses the bare source callback ID instead of the runner’s `__chunks-1` ID. It fails for native and token variants alike. Failed rows are excluded from timing comparisons.
2. JSON range access still has the roughly 67 KB metadata/prefetch floor. No format/index redesign was made, and transferred bytes are not reduced by these runtime changes.
3. Fresh/warm app-router boot remains a bottleneck. The measured improvement is too small and inconsistent to call it solved.
4. Existing NDJSON byte accounting uses full Content-Length even when reading stops early. This is not actual consumed wire traffic.
5. JSON/matrix/app UI results store aggregates rather than every raw sample; encode/archive timings are single samples. These limits carry over from the baseline. No confidence or statistical-significance claim is made for small differences.

The detailed JSON is the source of truth. `comparison.json` contains paired successful cases and coverage; `analysis.json` summarizes the new results; `manifest.json` records the runtime snapshot and methodology. No commit or deployment was made.
