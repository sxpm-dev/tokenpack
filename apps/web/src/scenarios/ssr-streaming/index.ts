// SSR streaming scenario — registry metadata only. The actual UI lives in
// `app/scenarios/ssr-streaming/page.tsx` (a custom override, not the generic
// `[scenarioId]` template). The variants are listed here for the homepage
// card and for the override page's table to consume — but the variant.run
// functions throw, since this scenario is rendered through its own custom
// page that does not use the generic runner loop.

import type { RunMetric, ScenarioDef } from '../types'

const explanation = `## What is measured

The server embeds the same customer records as JSON text and a base64 PNG.
After the page has loaded, this comparison measures access, decoding and parsing
into a JavaScript object. It does not measure HTML transfer, HTML parsing,
first paint or end-to-end SSR startup. Both representations coexist on this page.

The JSON path reads script text and parses it. The PNG path decodes a prepared
Blob and parses its content; converting the data URI into that Blob happens
before timing. No preload or image-cache performance advantage is assumed.

Sizes show UTF-8 JSON bytes and the full PNG data URI including base64 overhead.
Actual compressed HTTP transfer size is outside this measurement.
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
  name: 'SSR inline data',
  description:
    'Decode server-inlined JSON and PNG after page load. HTML transfer and parsing are excluded.',
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
        'PNG inlined as a data URI. Blob preparation happens before timing; measured path is `decode(blob)` → `JSON.parse`.',
      run: customPageRunner,
    },
  ],
}
