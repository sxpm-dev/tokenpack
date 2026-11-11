# Runtime performance design and implementation plan

Goal: reduce avoidable decode, streaming and fetch overhead across Node/browser runtimes, including router materialization; compare against the immutable 2026-11-11T04-45-56Z baseline.

Approach: preserve formats, public output and fixtures. Reuse pixels decoded during algorithm detection; replace stream timer polling with notifications and queued input; coalesce multi-file range reads; respect HTTP caching; deduplicate router file decoding within a router instance. These choices target work visible in source and baseline measurements. A new codec/format or global URL cache would confound comparison and introduce invalidation/memory risks, so neither is part of this change.

Constraints: retain existing working-tree baseline data. No commit or deployment. No new dependencies. Do not conceal compatibility skips or the known high-entropy fixture failure. Keep fixtures identical during before/after measurements. Use Node 22.16.0 and the same production Chromium/local workload. Cached bytes are scoped to a router instance, and failures must be evicted for retry. Stream errors must reject readers rather than hang.

- [x] Regression tests: one surface decode per buffered token; fragmented/error stream delivery without polling; grouped range reads and HTTP cache policy; repeated/concurrent router reads and retry.
- [x] Implement shared detection reuse and browser copy reductions.
- [x] Implement notification-driven PNG streaming with chunk queue and error propagation.
- [x] Implement grouped range API reads and scoped router content reuse.
- [x] Run all core/Node/browser tests, type checks, production build and playground verification.
- [x] Run all static/unit/playground benchmarks sequentially into a new dated directory. Preserve original baseline. Compare matched successful cases and control-method drift; document regressions and limitations.

Execution: inline, as authorized by the user. The user explicitly requests design and implementation without ordinary approval checkpoints.

Verification so far: 191/191 unit tests; library build and browser-safety check passed; production build passed. Focused async review found slow-consumer row loss and duplicate-path stream locking; both reproduced in failing tests and fixed, full suite rerun green. Existing playground verification needed to accept the saved-results Re-run button label.

Completed: 192/192 unit tests; library/browser-safety/production builds passed. Full matrix: 300 static fetch rows, 60 codec rows, 15 archive timings, 20 unit rows, 683 playground runs (682 pass; same one known fixture failure). 683 fixture fingerprints match; 555 persisted configurations verified. Node router reuse added after main matrix and measured in a separate alternating old/new probe, because the matrix has no Node router workloads. Full comparison and limitations are in benchmark-results/baselines/2026-11-11T05-15-18Z-runtime-optimized/REPORT.md.
