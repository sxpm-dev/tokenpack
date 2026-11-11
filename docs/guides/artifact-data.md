# Give an interactive artifact its own data package

An analyst uses the same expense explorer each month. A colleague needs the November data, currency and saved view, without receiving a new copy of the application.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/artifact-data/`.

## What the package contains

- `manifest.json`
- `data/expenses.json`
- `view.json`
- `provenance.json`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `data/expenses.json` contains:

```json
[
  {
    "id": "exp-101",
    "department": "Design",
    "amountMinor": 12500,
    "currency": "USD"
  },
  {
    "id": "exp-102",
    "department": "Engineering",
    "amountMinor": 24000,
    "currency": "USD"
  }
]
```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts artifact-data
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `artifact-data.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Decode data/expenses.json and view.json in the existing explorer. Validate amountMinor as integer cents and require a common currency before aggregation. Apply the saved selection after loading the records.

## Check the result

The total is 36500 cents (365.00 USD); exp-102 remains selected. The app binary stays unchanged when the monthly data pack is replaced.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

These two records demonstrate the contract, not large-data performance. For partial access, split large data into separately named partitions before encoding; the decoder cannot range-fetch an arbitrary nested key from one monolithic JSON file.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.
