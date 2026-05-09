# tokenpack-replay-harness

Playwright-driven harness for measuring TokenPack-based page-load delivery against a baseline, on any target URL.

## Usage

```bash
yarn workspace tokenpack-replay-harness run record public-demo
yarn workspace tokenpack-replay-harness run upload public-demo
yarn workspace tokenpack-replay-harness run benchmark public-demo FAST_4G 10
```

See `docs/superpowers/specs/2026-05-05-tokenpack-replay-harness-poc-design.md`.

## Auth

Two mechanisms are supported.

### storageState (cookies + localStorage)

```bash
yarn workspace tokenpack-replay-harness run login <target>
```

Opens a headed Chromium pointed at `target.url`. Log in manually, then return to the terminal and press ENTER. The harness writes the auth state to `session-storages/<id>.json` (outside `fixtures/` so wiping the fixture dir doesn't take auth with it). Subsequent `record` and `benchmark` runs read it automatically.

### Extra HTTP headers

For targets that need a static `Authorization` header or similar, set `extraHeaders` on the `TargetConfig`. Values are merged via `context.setExtraHTTPHeaders` and applied to all outgoing requests for the run.

### Security

- Captured pack files are uploaded to the configured S3 bucket. Header scrubbing (allowlist in `src/encode/header-scrubber.ts`) strips `Set-Cookie`, `Authorization` echo, and any header not on the allowlist before bytes are written.
- Auth state files (`session-storages/*.json`) are gitignored.
