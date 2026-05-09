// SSR streaming scenario — registry metadata only. The actual UI lives in
// `app/scenarios/ssr-streaming/page.tsx` (a custom override, not the generic
// `[scenarioId]` template). The variants are listed here for the homepage
// card and for the override page's table to consume — but the variant.run
// functions throw, since this scenario is rendered through its own custom
// page that does not use the generic runner loop.

import type { RunMetric, ScenarioDef } from '../types'

const explanation = `## What's going on

When the server streams HTML to the browser, **inlined data starts being
parsed/decoded as it arrives** — the browser doesn't need a separate fetch.
This scenario asks: *for an SSR-bootstrapped payload, what's the fastest
inlining strategy from "HTML body parsed" to "JS object ready"?*

### Variants

| Variant | What's inlined | Decode path |
|---|---|---|
| \`inline-json-script\` | JSON in \`<script type="application/json">\` | \`document.getElementById\` → \`textContent\` → \`JSON.parse\` |
| \`tokenpack-inline-img\` | PNG in \`<img src="data:image/png;base64,…">\` | \`fetch(img.src)\` → \`blob\` → \`decode(blob)\` → \`JSON.parse\` |

### Why TokenPack can win

When a \`<link rel="preload" as="image" href="data:...">\` is in the document
head, the browser begins **PNG decoding off the main thread** before the body
is even parsed. By the time JS runs, the rasterized bitmap is already cached.
The TokenPack codec then only needs to read pixel bytes + decompress —
network round-trip and image decode are gone.

For sub-100KB JSON, plain inline-script is virtually free (\`JSON.parse\`
of pre-parsed text). Above ~50 KB the parser pause becomes visible, and
TokenPack's *off-thread image decode + cheap codec* path catches up.
`

const customPageRunner = async (): Promise<RunMetric> => {
  // The override page bypasses the generic runner — these variant entries
  // exist for the homepage card and for documentation. If something does
  // route through the generic [scenarioId] page, throwing here surfaces the
  // misconfiguration instead of silently returning bogus numbers.
  throw new Error(
    'ssr-streaming variants are measured by the custom page override, not the generic runner',
  )
}

export const ssrStreamingScenario: ScenarioDef = {
  id: 'ssr-streaming',
  name: 'SSR streaming',
  description:
    'Inlined into the server-streamed HTML — compares <script type=application/json> vs preloaded <img> for boot speed.',
  explanation,
  variants: [
    {
      id: 'inline-json-script',
      label: 'inline JSON <script>',
      compat: 'full',
      detail:
        'JSON inlined as `<script id="ssr-payload-json" type="application/json">…</script>`. Decode path: `document.getElementById` → `textContent` → `JSON.parse`. The HTML parser already paid the cost of reading the bytes.',
      run: customPageRunner,
    },
    {
      id: 'tokenpack-inline-img',
      label: 'TokenPack inline <img>',
      compat: 'full',
      detail:
        'PNG inlined as `<img src="data:image/png;base64,…">` with a `<link rel="preload" as="image">` in the head. Decode path: `fetch(img.src)` → `blob` → `decode(blob)` → `JSON.parse`. Image decoding happens off-thread before JS runs.',
      run: customPageRunner,
    },
  ],
}
