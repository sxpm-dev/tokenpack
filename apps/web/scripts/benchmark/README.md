# App Benchmark Pipeline

The app package owns the full benchmark pipeline: node token/archive fixture generation, node fetch/decode measurements, extended encode/decode measurements, and browser runtime fixtures.

Root command:

```sh
yarn benchmark
```

App-local commands:

```sh
yarn workspace tokenpack-web benchmark:generate
yarn workspace tokenpack-web benchmark:run
yarn workspace tokenpack-web benchmark:run:extended
yarn workspace tokenpack-web benchmark:runtime
```

Input sources are read from `benchmark/sources`. Generated fixtures are grouped under one app-local root:

```text
apps/web/benchmark-fixtures/
  node/      # token/archive fixtures for node benchmarks
  runtime/   # API-served browser runtime fixtures
```

Results are written to `apps/web/benchmark-results`.

## Fixture corpus

The saved tables use a captured editor configuration JSON, React DOM's production client bundle, and a captured editor JavaScript bundle. Source sizes come from bytes on disk. The historical `chunk-5mb.js` filename does not describe its current size. Runtime CRM JSON is deterministic and uses structured customer records with ordinary support notes. Synthetic app delivery fixtures are labeled synthetic and compare identical selected assets across delivery methods.

Encode measurements from fixture generation are single samples. Decode measurements include warmups and repeated samples. The extended benchmark uses batch decoding even when a recipe also supports streaming. Browser playground results must be measured in the production server before being treated as benchmark evidence.

`yarn benchmark` regenerates all active static, browser, JSON, diff, scenario and synthetic app fixtures, records measurements and provenance, then audits referenced files and removes obsolete generated artifacts. Encoder caches are retained separately. `benchmark:audit` checks sizes and available SHA-256 hashes without deleting anything; `--prune` removes files absent from authoritative manifests only.

Browser source-content cases use original captured bytes. Generated-script cases wrap those bytes as string data and register them; they measure transfer, parsing and registration, not execution of the captured application. The high-entropy case is a synthetic stress case, not a typical JavaScript bundle. Small JSON assets are complete documents. The gzip baseline is raw gzip, not a tar archive.

Completed playground runs are saved under `benchmark-results/playground-runs/`, keyed by controls and execution mode, and restored only when fixture fingerprints match. Development and production results are kept separate. These are measurements of the local machine/browser, not universal rankings. Rebuilding fixtures invalidates earlier snapshots. Changing controls during a run discards that run rather than saving it under the wrong configuration.

Production verification:

```sh
yarn web:build
yarn workspace tokenpack-web start
# In another terminal:
yarn workspace tokenpack-web benchmark:verify-playgrounds
```

The browser check runs real controls and verifies saved results through the API. It writes a coverage report to `benchmark-results/playground-verification.json`. `BENCH_ONLY=/json-playground` can restrict a diagnostic rerun to one route. Browser support limits remain visible as skipped variants, rather than invented timings.

JSON chunk fixtures serialize selected objects with `JSON.stringify`, so measured payload bytes exclude source indentation. Provenance records the original on-disk source hash and size; individual result rows record the actual serialized payload size. The partial-fetch fixture uses `pixel-range-none` outside and independent deflate regions inside, preserving byte-range addressability.
