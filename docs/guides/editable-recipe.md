# Keep an exported chart editable

An analyst shares a monthly revenue chart and wants a recipient to change the period or color while preserving the underlying values and recipe.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/editable-recipe/`.

## What the package contains

- `manifest.json`
- `data.json`
- `recipe.json`
- `preview.svg`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `data.json` contains:

```json
[
  {
    "month": "Oct",
    "revenue": 120
  },
  {
    "month": "Nov",
    "revenue": 150
  }
]
```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts editable-recipe
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `editable-recipe.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Read recipe.json and data.json into a compatible chart renderer. Change color and render a new preview. Save the changed recipe with the same source data for the next recipient.

## Check the result

November is 25% higher than October; changing color must not change either value. The included preview is a separate file inside the pack, not a custom cover on the outer PNG.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

A recipe needs a compatible renderer and pinned semantics. It does not capture arbitrary editor internals. Existing image metadata workflows are an alternative when one editor already provides reliable import/export.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.
