# Portable workflow examples

TokenPack can preserve a set of named files as an image-encoded package. The useful unit is often an editable configuration, application, dataset or explicit work state—not simply compressed bytes.

These are **synthetic, runnable examples**, not customer case studies. Each guide includes source files, a receiving workflow, expected results and limits. The website renders the same Markdown files at `/use-cases/<slug>`; `index.json` supplies the reading order. Generated sample packs and verification records are committed under `apps/web/public/examples/workflows/` so the browser checks require no local API.

## Start here

| Workflow | Concrete example | Fit assessment |
| --- | --- | --- |
| [Configuration](configuration.md) | Restore support dashboard filters, columns and palette | Strong when settings include dependent assets |
| [Artifact data](artifact-data.md) | Reuse an expense explorer with a separate monthly dataset | Strong when application and data travel independently |
| [Portable application](portable-app.md) | Extract a standalone HTML cost calculator | Strong for self-contained tools; requires an explicit loader |
| [Bug reproduction](bug-reproduction.md) | Reproduce an invoice rounding rule from exact inputs | Strong for reproducible support and test fixtures |
| [Agent checkpoint](agent-checkpoint.md) | Verify extracted invoice totals and resume a report | Useful across tools; shared storage is simpler within one system |
| [Editable recipe](editable-recipe.md) | Rebuild a revenue chart from data and rendering parameters | Strong when a compatible editor understands the recipe |
| [Review snapshot](review-snapshot.md) | Review a pricing revision with calculations and comments | Useful when identity and approval are handled separately |
| [Offline workspace](offline-workspace.md) | Restore an inspection draft and reference checklist | Useful with an already available offline application |
| [Reference pack](reference-pack.md) | Update a kiosk catalog and translations | Useful for versioned, independently distributed content |
| [Web delivery](web-delivery.md) | Read selected application/data files through a router | Workload-dependent; compare against native delivery |

These assessments describe workflow fit, not measured scores or production readiness. Small JSON, ZIP, ordinary module delivery and shared storage remain valid alternatives.

## Reproduce all examples

Use Node 22 and the installed Yarn workspace dependencies. From the repository root:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts
```

Add a slug such as `configuration` to run one example. The runner compares the file list and every decoded byte, checks a workflow-specific data invariant, and emits a PNG plus a verification JSON. The web-delivery case additionally emits and decodes a router bundle. The fixtures are intentionally small; they do not replace the performance benchmark corpus.

## Encode and read named files

This is the contract used by the runner:

```ts
import { decode, encode, PackBuilder } from '@tokenpack/node'

const result = await encode(
  new PackBuilder()
    .withFile('config.json', JSON.stringify({ schemaVersion: 1, threshold: 24 }))
    .withFile('notes.md', 'Support dashboard preset'),
  { algo: 'pixel-range-none', compressor: 'deflate-6' },
)
const pack = await decode(result.bytes)
if (!pack.isPack()) throw new Error('Expected a directory pack')
const config = JSON.parse(await pack.text('config.json'))
if (config.schemaVersion !== 1) throw new Error('Unsupported configuration schema')
```

In the browser, import `decode` from `@tokenpack/browser` and give it the downloaded bytes. The website loads that decoder only when the reader chooses **Verify example in browser**. It verifies the outer SHA-256, the file count, and each restored file's length and SHA-256. No embedded script is executed.

For selective network reads, encode separately named files with a range-addressable approach and use the range API or router. Merely naming a nested JSON property does not make it independently fetchable. A small selected object can still incur metadata and range overhead.

## Application responsibilities

- Validate schema versions, required fields, sizes and allowed file types before changing application state.
- Keep credentials, device paths and account-specific authorization out of portable defaults.
- Apply imports atomically and preserve a recoverable previous version.
- Treat embedded instructions and executable files as untrusted input. A container is not a sandbox.
- Track source provenance and explicitly declared decisions. Agent exports do not contain hidden model state.
- Keep every artifact emitted by a router, including files referenced relative to its manifest.

The current examples embed a manifest by convention. They do not introduce a universal import schema, automatic migration, app viewer, cryptographic signature or native AI-tool integration.

## Transport boundaries

Original byte-preserving attachments and downloads are the intended transport. Chat and email providers must be tested individually, including their attachment and inline-image modes. Screenshots, resizing, format conversion, recompression or metadata stripping can invalidate the payload. No universal pipeline-survival claim is made.

A checksum shipped alongside a pack is useful for detecting accidental corruption, but an attacker can replace both. Compare against a trusted sender digest or implement signature verification for authenticated provenance. Being a PNG provides neither encryption nor authorization.

A preview file inside a pack is also distinct from a designed cover image on the outer PNG. These samples include the former where useful; they do not implement the latter.
