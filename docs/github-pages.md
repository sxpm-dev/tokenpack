# GitHub Pages

The only Git remote is `origin`: https://github.com/sxpm-dev/tokenpack.
The published site lives at https://sxpm-dev.github.io/tokenpack/.

## Build and publish

Use Node 22.16 and Yarn 4.3.1:

```sh
corepack enable
yarn install --immutable
yarn pages:build
```

The build creates a disposable `apps/.pages-build` directory and exports static HTML,
CSS, JavaScript and data to `apps/.pages-build/out`. It preserves the original local
application. Next.js is a build dependency; the published site has no Next.js server.
A full migration to another documentation framework is not part of this deployment.

The Pages workflow runs unit tests, builds the export, uploads it, then deploys on
pushes to `main`. GitHub repository Settings → Pages must use GitHub Actions.
Deep links use exported directories with `index.html`, not a catch-all SPA fallback.
`PAGES_BASE_PATH` defaults to `/tokenpack`; use an empty value for a domain root.

## Available on the static site

- Documentation and all workflow guides, including downloads and browser verification.
- Browser encode/decode, router planner, file build/explore/diff with supported codecs.
- Saved server fetch and encode/decode tables.
- Saved configurations and complete JSON results for server-dependent playground runs.

Server codecs and decompression fallbacks are disabled on Pages. Use a supported
browser codec or run `yarn app` locally for server functionality. The server-dependent
benchmark routes show saved measurements rather than controls that would call missing APIs.

The published evidence is explicitly pinned in `build-pages.mjs` to
`2026-11-11T05-15-18Z-runtime-optimized`: 683 saved playground runs. The report retains
known failures and measurement limitations. Publishing never reruns benchmarks or
relabels those historical measurements as performance of GitHub Pages.

## Maintenance

`build-pages.mjs` owns the static route substitutions and baseline selection.
Keep new server-only routes in its explicit map. Ordinary Next links get the configured
base path automatically; static file requests and ordinary anchors use `sitePath()`.
The exported output is ignored by Git and must not be committed.

After building, run `yarn pages:verify` to serve the export on a plain static HTTP
server and check deep links, saved data, all ten guide decoders, browser encoding,
the router planner and file build/explore. Set `PAGES_URL` to the deployed site URL
(without a trailing slash) to run the same checks against GitHub Pages.

## Initial history import

The initial GitHub import removed historical `dashboard/node_modules/` and
`dashboard/.next/` artifacts, including a dependency above GitHub's file size limit.
Current source files were unchanged by this cleanup. Original-to-imported commit IDs
are recorded in [history-import-map.txt](history-import-map.txt), so commit IDs in older
benchmark provenance can be resolved. A complete pre-import Git bundle was retained locally.
