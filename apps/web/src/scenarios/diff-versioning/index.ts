// diff-versioning scenario — registry metadata only.
//
// The actual UI lives in `app/scenarios/diff-versioning/page.tsx` (custom
// override, not the generic `[scenarioId]` template) because the comparison
// is two-dimensional (bundle size × change rate) and benefits from a
// matrix-shaped results panel rather than a single variant table.

import type { RunMetric, ScenarioDef } from '../types'

const explanation = `## What's going on

A deployed SPA with version v1.0.0 is already cached on the client. A new
v1.0.1 ships. Four delivery strategies are compared head-to-head:

| Strategy | What's fetched | Encoding controllable? |
|---|---|---|
| \`next-token\` | full v1.0.1 TokenPack PNG | no — inner deflate is the compression |
| \`diff-token\` | diff(v1.0.0 → v1.0.1) TokenPack PNG | no — inner deflate is the compression |
| \`js-bundled\` | one big \`bundled.js\` + \`bundled.css\` | yes — \`Content-Encoding: identity \| gzip \| br\` |
| \`js-chunked\` | \`index.js\` + \`index.css\` + N chunks (parallel) | yes — \`Content-Encoding: identity \| gzip \| br\` |

The diff path **assumes the client already has v1.0.0** in memory — that's
the realistic upgrade scenario. Token strategies don't expose a
\`Content-Encoding\` axis because PNG bytes are already deflate-compressed
inside the codec; wrapping in HTTP gzip/br on top buys < 1 % and isn't a
realistic deployment.

The JS strategies mirror what real apps ship today: a build-time bundler
emits a single bundle (or a code-split set of chunks) and a CDN serves
them with \`Content-Encoding\`.

The interesting variables:
- **change rate** — how much of the SPA changed (1 %–90 %). Determines
  diff size; high churn shrinks the diff advantage.
- **bundle size** — 100 KB up to 5 MB. Bigger bundles amplify both diff
  savings and per-request overhead.
- **JS encoding** — gzip vs brotli vs identity. Tabbed at the top.
- **throttle** — Local/Fast CDN/Average/Slow. Diff's bandwidth advantage
  turns into latency wins on slow networks.

The matrix shows total time per (size, rate) for each strategy, plus
ratio matrices in the collapsed footer comparing each strategy against
the diff baseline.
`

const customPageRunner = async (): Promise<RunMetric> => {
  throw new Error(
    'diff-versioning variants are measured by the custom page override at /scenarios/diff-versioning',
  )
}

export const diffVersioningScenario: ScenarioDef = {
  id: 'diff-versioning',
  name: 'SPA upgrade: full reload vs. diff apply',
  description:
    'Client already has base bundle. Compares full-bundle reload vs. diff-only fetch + applyDiff across a matrix of bundle size × change rate.',
  explanation,
  variants: [
    {
      id: 'full-reload',
      label: 'full reload',
      compat: 'full',
      detail: 'Fetch the new full bundle TokenPack PNG, decode → unpack → ready.',
      run: customPageRunner,
    },
    {
      id: 'apply-diff',
      label: 'apply diff',
      compat: 'full',
      detail:
        'Base bundle already in memory. Fetch only the diff TokenPack PNG, decode → `applyDiff(base, diff)` → ready.',
      run: customPageRunner,
    },
  ],
}
