# Share a minimal bug reproduction

Support reproduces an invoice rounding error and gives engineering a compact input, expected result and exact reproduction steps.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/bug-reproduction/`.

## What the package contains

- `manifest.json`
- `input.json`
- `expected.json`
- `environment.json`
- `steps.md`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `input.json` contains:

```json
{
  "currency": "USD",
  "unitPriceMinor": 1999,
  "quantity": 3,
  "discountPercent": 10
}
```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts bug-reproduction
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `bug-reproduction.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Import the input into an invoice test harness, run the steps with the pinned rounding rule and assert against expected.json. Keep the same pack as a regression fixture after the bug is fixed.

## Check the result

The rounding contract produces 5397 cents. A result of 5398 or 5396 is a failed reproduction check, not a decoding failure.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

The example is a synthetic regression case, not evidence of a bug in TokenPack. Remove customer data and secrets before export. A pack records environment metadata; it cannot recreate an operating system or dependency installation by itself.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.
