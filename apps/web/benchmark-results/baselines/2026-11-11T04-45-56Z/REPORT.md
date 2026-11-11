# Benchmark baseline — 11 November 2026

Completed on one Apple Silicon host with Node 22.16.0 and headless Chromium 147.0.7727.15. Static and browser suites ran sequentially against the production application. This is a measured baseline, not a release pass: one fixture case failed verification.

## Coverage and saved data

- Static: 300 fetch rows (3 source cases × 25 variants × 4 network presets), 60 codec/decode rows, 60 fresh single-sample encode timings, 15 archive timings, and 20 unit operations (30 samples each).
- Playground: 683 runs/configurations; 682 passed and one failed. These cover 409 JSON paths, 72 browser-fetch selections (24 sources/chunk configurations × 3 tabs), all 30 apply-diff cases, the complete 30-cell diff matrix, 9 size/scenario selections, SSR decode, 32 component-bundle rows, 100 partial-fetch runs (10 targets × 2 modes × 5 repeats), and 60 app selections (3 sizes × 2 scopes × 2 cache modes × 5 methods).
- Eighteen scenario variant measurements were skipped by compatibility gating. A runtime probe confirmed this Chromium cannot construct DecompressionStream('br') or DecompressionStream('brotli'). Native HTTP Brotli still ran.
- All 555 distinct saved configurations were read back from the app API and matched the final measurements. Repeated partial runs and intermediate app selections are retained individually in this baseline.
- `manifest.json` records environment, scope and limitations; `analysis.json` contains comparisons; `playground-coverage.json` indexes every run; `playgrounds/` contains complete saved responses. Raw samples are preserved where the existing suites expose them. JSON, matrix and app results only expose aggregates.

## Results

### Static delivery and codec cost

There is no universal fastest format. Local 4.92 MB JS delivery took 4.71 ms for pixel-range-none versus 10.43 ms for the fastest native archive (gzip). Under the average network preset, compressed range tokens and native Brotli were essentially tied: 140.76 versus 139.78 ms. Under the slow preset they were 502.29 versus 506.75 ms. These small network-case differences are not convincing wins given run variance.

The static JSON workload favored native deflate locally: 1.08 ms versus the best token's 1.51 ms. For the large JS fixture, single-sample encode times ranged from 16.9 ms for pixel-range-none to 7,094.5 ms for linear-webp. High compression should be prepared ahead of requests; these single samples do not establish a stable encode distribution.

At 1 MiB, the unit median was 2.66 ms for Node tpAK insertion and 2.62 ms for the browser implementation running under Node. Extraction was approximately 0.001 ms because it returns a byte view; this is not the cost of copying or decoding a full payload. Public Node encode/decode medians were 2.95/3.21 ms for pixel-range-none and 17.23/3.33 ms for pixel-range-deflate on the deterministic unit input.

### JSON access

Across 409 paths, medians of per-path medians were:

| Method | Time | Median reported body bytes |
|---|---:|---:|
| Exact-record API | 1.0 ms | 415 |
| Range fetch | 4.0 ms | 67,457 |
| Range stream | 3.8 ms | 67,457 |
| Whole linear token | 5.9 ms | 339,462 |
| Whole raw JSON | 14.6 ms | 3,767,658 |
| Whole Brotli JSON | 14.8 ms | 73,640 |

Range access avoids most document parsing, but its metadata/prefetch floor leaves only about 8% median body-byte savings versus the already-small Brotli document. An exact API is substantially better when a server can provide it. The range approach is most relevant when serving static indexed data without that API.

NDJSON completed early for many paths, but its byte column currently records the entire response Content-Length even when the reader is cancelled. Those values are not measured consumed wire bytes and should not be used to rank early-stop transfer savings.

### Browser fetch

Of 432 variant measurements, 426 completed and six failed in one fixture case. Observed fastest variants by tab (small gaps are not statistically significant):

- Full source: range fetch/stream won 16 of 24 selections; native Brotli won 7; router text won 1.
- Exact files: native Brotli won 14 of 24; range fetch won 6; router text won 4.
- Generated scripts: router materialization won 18 of 23 valid selections; native Brotli won 5. The high-entropy case is excluded because every variant failed verification.

### Updates and partial fetch

The synthetic diff matrix shows strong small-update savings: for 5,000 KB at 1% change, diff delivery/apply took 2.6 ms versus 19.8 ms for the next full token, with roughly 1% of its bytes. At 90% change, the gap shrank to 16.6 versus 19.6 ms and roughly 89% of the bytes. All matrix cells verified.

The separate apply-diff suite is less favorable: native full delivery was the observed fastest in 26 of 30 cases; changed-range streaming and full tokens each won 2. Do not generalize the synthetic matrix's advantage to all update workloads.

For the small ten-module partial-fetch fixture, text-mode median times were 9.1 ms for range fetch, 2.6 ms for the whole pack, 1.1 ms for one native file and 5.0 ms for all native files. Range fetch used about 10.3 KB versus the whole pack's 23.4 KB, but extra requests/metadata cost more than those saved bytes on localhost. This fixture demonstrates byte selection, not a local latency advantage.

### App and other scenarios

The router was not the fastest in any of the 12 app size/scope/cache combinations. For the large full app, cold router delivery was 241.3 ms versus 204.1 ms for the dynamic bundle; warm delivery was 210.9 ms versus 60.5 ms. Warm cache behavior is a clear optimization target. These are synthetic headless-app measurements, not real-user performance scores.

Inline JSON, stream boot and cache-read scenarios favored native methods in the measured local cases. The 100 KB SSR playground decoded inline JSON in 0.3 ms versus 1.5 ms for an inline token; the token body was smaller (12.4 KB versus 102.6 KB). This measures decoding after page load, not SSR or first paint. In the component-bundle case, at 5,120 KB token multifile was 26.2 ms, close to native Brotli chunks at 25.6 ms; the single bundled form took 59.1 ms.

## Review findings and next work

1. **Fix the generated high-entropy script's callback ID.** `makeSingleChunkBenchmarkScript` receives `less-compressible-large-js`, but the runner registers `less-compressible-large-js__chunks-1`. All six methods report zero verified callbacks. Failed measurements are retained, not treated as timings.
2. **Correct NDJSON byte accounting/labeling.** Content-Length is the full response size, not the bytes consumed before cancellation.
3. **Reduce/reuse JSON range metadata and measure repeated accesses.** The ~67 KB floor dominates small records. Separate initial access from subsequent indexed reads.
4. **Investigate warm router materialization cost.** The large full-app warm router path is about 3.5× the best measured method here. Retain native HTTP baselines while optimizing.
5. **Improve measurement strength before publishing performance claims.** Preserve raw JSON/matrix/app samples, repeat encoding, randomize variant order, and test browser workloads under representative latency. Five-sample p95 is effectively the maximum sample, and near-zero durations hit timer precision limits.

No application behavior was changed during these measurements. The failing fixture and accounting issues remain review findings. This baseline covers all available case selections at local playground network settings, not every network-preset cross-product or every browser engine. Static fetch benchmarks cover all four configured presets. Static JSON is minified; the JSON playground uses the original formatted document, so cross-suite byte comparisons are inappropriate.
