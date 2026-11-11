# Distribute a versioned reference catalog

A retail kiosk needs product descriptions and translated labels that can be updated independently of the kiosk application.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/reference-pack/`.

## What the package contains

- `manifest.json`
- `catalog.json`
- `locales/en.json`
- `locales/fr.json`
- `release.json`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `catalog.json` contains:

```json
{
  "schemaVersion": 1,
  "version": "2026-11",
  "products": [
    {
      "id": "tea-01",
      "labelKey": "tea",
      "priceMinor": 450
    }
  ]
}
```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts reference-pack
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `reference-pack.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Install the pack into a temporary store, validate required locale keys and product IDs, then switch the active catalog atomically. Keep the prior version for rollback. For large catalogs, partition by locale or product category.

## Check the result

Product tea-01 displays Thé vert in French at 450 minor currency units. The example deliberately leaves currency to the host’s catalog contract; production schemas should make it explicit.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

Version labels are not integrity checks. Include trusted hashes or signed release metadata. Range access requires a range-capable host and suitable encoding; ordinary HTTP compressed JSON may be simpler for a small catalog.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.
