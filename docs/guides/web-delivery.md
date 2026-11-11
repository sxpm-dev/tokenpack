# Load selected files through a router

A web application has a shared entry and a reports module that is only needed when the user opens Reports. The experiment compares whole delivery with selective file loading.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/web-delivery/`.

## What the package contains

- `manifest.json`
- `app/main.js`
- `app/reports.js`
- `data/report.json`
- `app/styles.css`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `app/main.js` contains:

```text
export const application = "Reports demo";

```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts web-delivery
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `web-delivery.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Run the router example below, retain every emitted artifact, and load only data/report.json first. In a browser integration, fetch the reports module when the route is selected. Measure transferred bytes, decode work and time until usable data.

## Check the result

The report values sum to 60. Inspect the router file list and confirm the expected files are recoverable. The tiny fixture proves correctness; use the linked benchmarks for timing comparisons.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

A router may emit several files; moving only router.png can break relative references. This is not a replacement for module bundling, dependency resolution or browser caching. Compare against native code splitting and Brotli with equivalent cache and workload conditions.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.

## Router encoding and selective reading

The example runner also executes this API path with the sample files:

```ts
import { encode, decodeRouter, TokenPack } from '@tokenpack/node'
import { mkdir, writeFile } from 'node:fs/promises'

const artifacts = await encode(
  new TokenPack()
    .withFile('data/report.json', JSON.stringify({ values: [12, 18, 30] }))
    .withFile('app/main.js', 'export const application = "Reports demo";')
    .router({ chunkLayout: 'source-order', fileCompressor: 'deflate-6' }),
)
await mkdir('./report-bundle', { recursive: true })
for (const artifact of artifacts) {
  await writeFile(`./report-bundle/${artifact.filename}`,
    new Uint8Array(await artifact.blob.arrayBuffer()))
}
const router = await decodeRouter('./report-bundle/router.png')
if (!router.isRouter()) throw new Error('Expected a router pack')
const report = JSON.parse(await router.text('data/report.json'))
console.log(report.values.reduce((sum, value) => sum + value, 0)) // 60
```

The one-file download below is the equivalent directory pack for easy inspection. The generated router bundle is a separate output at `apps/web/public/examples/workflows/web-delivery-router/`. To test network savings, host the full bundle and measure actual requests; the local round-trip assertion does not measure transfer savings.

Compare with [browser fetch](/browser-fetch-bench), [application delivery](/benchmarks/app), and [JSON paths](/json-playground). Use the same source, selected data, cache state and compression baseline.
