# Restore a small offline workspace

A field worker takes a site inspection template, reference information and a draft report to a location without connectivity.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/offline-workspace/`.

## What the package contains

- `manifest.json`
- `workspace.json`
- `notes/draft.md`
- `reference/checklist.json`
- `assets/site.json`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `workspace.json` contains:

```json
{
  "schemaVersion": 1,
  "project": "Warehouse inspection",
  "activeFile": "notes/draft.md",
  "referenceVersion": "2026-11"
}
```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts offline-workspace
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `offline-workspace.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Download the complete pack before going offline. Import the files into a local editor, select notes/draft.md, and save changes into a new pack. Keep the original snapshot until the edited copy is validated.

## Check the result

All three checklist items and the draft are available with networking disabled. Reopening the exported copy must preserve the edited notes.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

The application shell must already be installed or cached. Referenced URLs are not included automatically. Concurrent edits need conflict handling; a pack diff is not a collaborative merge algorithm.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.
