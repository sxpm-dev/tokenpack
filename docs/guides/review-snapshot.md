# Review an exact version of an artifact

A team reviews a pricing policy document. The reviewer must see the exact proposal, supporting calculations and comments tied to that revision.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/review-snapshot/`.

## What the package contains

- `manifest.json`
- `proposal.md`
- `evidence.json`
- `review.json`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `proposal.md` contains:

```text
# Pricing policy revision 7
Seat price changes from 10 to 12 USD per month. Effective date: 2027-01-01.

```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts review-snapshot
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `review-snapshot.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Create a snapshot before requesting review. Send its SHA-256 through a trusted channel, verify it after receipt, and record the reviewer’s decision against that hash. A changed proposal requires a new snapshot and review.

## Check the result

The supporting calculation is a 200 USD monthly increase for 100 seats. The sample remains pending; packaging a review does not grant approval.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

A hash detects byte changes when compared with a trusted value; it is not an author signature or approval authority. Authentication, signatures, reviewer identity and retention policy are application responsibilities.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.
