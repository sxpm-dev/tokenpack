# Package a small standalone HTML application

A developer creates an HTML cost calculator with an AI coding assistant and wants another person to inspect the exact built application and its initial inputs.

This is a runnable, synthetic example of a production-shaped workflow, not a customer deployment or a performance claim. The sample files are in `examples/workflows/portable-app/`.

## What the package contains

- `manifest.json`
- `app/index.html`
- `state.json`
- `README.txt`

The manifest is an application convention for these examples, not a new TokenPack wire-format feature. It declares the workflow and schema version; the consumer still validates each payload.

For example, `app/index.html` contains:

```text
<!doctype html><html lang="en"><meta charset="utf-8"><title>Cost calculator</title><label>Seats <input id="seats" type="number" value="4" min="0"></label><p id="total"></p><script>const seats=document.querySelector("#seats"),total=document.querySelector("#total");function render(){total.textContent=`Monthly cost: $${Number(seats.value)*12}`}seats.addEventListener("input",render);render()</script></html>
```

## Run the example

From the repository root, after installing workspace dependencies with Yarn, use Node 22:

```sh
yarn workspace tokenpack-web exec tsx scripts/workflow-examples.ts portable-app
```

The command reads the source files, encodes a pack, decodes it, and verifies every restored byte. It writes `portable-app.png` and a JSON verification record under `apps/web/public/examples/workflows/`. Run without a case name to regenerate all ten examples. These are small correctness fixtures, separate from the performance benchmark corpus.

You can also download the generated pack on this page and import it in [Build / explore / diff](/playground/files). Inspect the listed files; the explorer does not implement the application-specific restoration described below.

## Use it in an application

Extract app/index.html and inspect its source. This sample embeds its script and has no remote dependencies. Open the extracted file to use it. A production importer should use an isolated origin or sandboxed iframe and explicit permission for network access.

## Check the result

The initial total is $48. Changing seats to 5 produces $60. The state.json file records the initial inputs; a richer viewer must explicitly hydrate saved state.

The automated runner checks byte-for-byte restoration and the sample’s data invariant. The application behavior above is the integration acceptance check; it is not supplied by the generic decoder.

## When to use something simpler

The PNG itself does not execute an app in an image viewer. TokenPack supplies the container; a loader is required. AI tools do not natively import this format unless an integration is built. Servers, credentials and external dependencies do not become portable by packaging their references.

## Transport and trust

Send the original file as an attachment or download. An inline image, screenshot, resized image or re-encoded copy is not a reliable transport. Compare the downloaded file’s SHA-256 with a trusted sender value before import. No chat or email provider is certified by this example. Do not treat the image format as encryption or permission to execute embedded code.

See [the workflow overview](/use-cases) for other examples and the API quickstart.
