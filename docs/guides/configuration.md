# Export and restore a dashboard configuration

A support team shares a weekly service dashboard with a colleague. The recipient needs the same filters, columns and thresholds, without copying account credentials.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/configuration/`.

## What the package contains

- `manifest.json`
- `config.json`
- `assets/palette.json`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `config.json` contains:

```json
{
  "schemaVersion": 1,
  "dashboard": "Support weekly",
  "timezone": "UTC",
  "filters": {
    "queue": "billing",
    "status": [
      "open",
      "pending"
    ]
  },
  "columns": [
    "ticket",
    "owner",
    "ageHours"
  ],
  "alertAfterHours": 24
}
```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts configuration
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `configuration.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Import config.json into a fresh dashboard. Validate schemaVersion, confirm the available queues and column names, then apply the settings atomically. Resolve account IDs against the receiving account rather than copying tokens.

## Check the result

The restored queue is billing, the column order is ticket/owner/ageHours, and the threshold is 24 hours. Change the local dashboard first to prove import actually restores it.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

A single small settings object is usually better as plain JSON. A pack becomes useful when settings depend on palettes, templates or other files. Schema migration and an import UI belong to the application; TokenPack does not supply them.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.
