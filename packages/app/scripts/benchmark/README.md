# App Benchmark Pipeline

The app package owns the full benchmark pipeline: node token/archive fixture generation, node fetch/decode measurements, extended encode/decode measurements, and browser runtime fixtures.

Root command:

```sh
yarn benchmark
```

App-local commands:

```sh
yarn workspace tokenpack-app benchmark:generate
yarn workspace tokenpack-app benchmark:run
yarn workspace tokenpack-app benchmark:run:extended
yarn workspace tokenpack-app benchmark:runtime
```

Input sources are read from `benchmark/sources`. Generated fixtures are grouped under one app-local root:

```text
packages/app/benchmark-fixtures/
  node/      # token/archive fixtures for node benchmarks
  runtime/   # API-served browser runtime fixtures
```

Results are written to `packages/app/benchmark-results`.
