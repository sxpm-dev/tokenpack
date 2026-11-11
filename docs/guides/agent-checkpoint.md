# Resume work from an explicit agent checkpoint

A research agent finishes extracting invoice totals. A second agent in another tool must verify them and write a report without repeating extraction.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/agent-checkpoint/`.

## What the package contains

- `manifest.json`
- `task.json`
- `outputs/totals.json`
- `evidence.csv`
- `decisions.md`
- `handoff.md`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `task.json` contains:

```json
{
  "schemaVersion": 1,
  "taskId": "invoice-review-42",
  "status": "awaiting-verification",
  "nextStep": "Verify totals against evidence.csv, then write report.md"
}
```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts agent-checkpoint
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `agent-checkpoint.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Give the receiving agent the original file and a decoder tool. Expose the named files as tool outputs, check taskId and schemaVersion, then recompute the total from evidence before resuming the next step.

## Check the result

The next agent can establish 2 invoices and 36500 cents from evidence, without relying on the first agent’s explanation alone.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

This preserves explicit inputs, outputs and decisions, not hidden model state or a guaranteed deterministic continuation. Shared storage and structured messages are simpler inside one orchestrator. A PNG preview alone does not give a model access to the embedded bytes.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.
