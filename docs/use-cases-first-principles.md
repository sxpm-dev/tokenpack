# Use Cases — First-Principles Rethink

> From-scratch analysis of where data-inside-an-image genuinely earns its keep,
> abstracted away from the existing docs/landing narrative. Source material for
> the next landing-page "featured use cases" revision.
> Date: 2026-06-11.

## The filter

The artifact has exactly five properties no plain binary container has. Every
good use case must lean on at least one — otherwise a `.zip` wins:

1. **Traverses image-only channels.** Chat apps, LLM chat UIs, image CDNs, OS
   clipboards, camera rolls, markdown, email inline, e-ink displays, paper —
   pipes that accept, render, cache, and sync images but reject or mangle
   arbitrary files.
2. **Has a visible surface.** The pixels can *show* something while the payload
   *carries* something. No other archive format has a face.
3. **Browsers and OSes privilege images.** Preload scanner, off-main-thread
   decode, image caches, photo-library sync — free infrastructure no blob gets.
4. **Humans already have image rituals.** Screenshot, paste, save-to-camera-roll,
   right-click-save. Zero new behavior to learn.
5. **Cameras can read it.** An optical channel, like QR but ~1000× denser.

## Ranked use cases

Ranking = unique fit × validated demand × buildable now.

### 1. The screenshot that contains its own reproduction (top pick)

The most universal debugging ritual on earth: user screenshots the bug, pastes
it into Slack/Linear/GitHub. The screenshot is nearly information-free — the
ritual exists anyway.

Make the app's "report a bug" button emit a *real screenshot* whose payload is
the console log, network trace, state snapshot, DOM serialization, feature
flags, session replay. The user pastes an image, exactly as before. A human
sees the screenshot. The triage bot or coding agent decodes the payload and
starts with full reproduction context.

Why it ranks first:

- The visible surface is **semantically the same thing** as the payload — a
  view of the moment.
- Piggybacks on existing universal behavior; zero friction, zero new ritual.
- The decoder sits in tooling we control (issue-tracker bot, agent skill) —
  no ecosystem adoption required.

### 2. The artifact whose preview IS the file (validated twice in history)

The pattern already won, twice:

- **Spore (2008)** — creature cards were PNGs with the full creature genome
  embedded. Players traded creatures by trading pictures of them.
- **ComfyUI / Stable Diffusion (today)** — generated images carry their full
  workflow/params in PNG metadata. Entire communities share *workflows* by
  sharing *images* on Discord and Reddit. De facto standard.

Both prove the demand: **share the recipe as a picture of the result.**
TokenPack is the strictly stronger version (compression, multi-file,
encryption, diff). Generalizations:

- Game levels shared as screenshots of the level.
- Synth patches as their waveform art.
- 3D-print profiles as a photo of the print.
- CAD parts as their render.
- Data-viz notebooks as the chart they produce.

Any community that shares *results* as images can be upgraded to sharing
*reproducible sources* with no change in behavior.

### 3. The vision-legible attachment (unexploited; inverts our own disclaimer)

Vision models see pixels, not bytes — so *use that*. Render the **manifest as
human-readable text in the visible pixels**: pack name, file tree, sizes, a
one-line "decode with `npx tokenpack open`", a QR to the decoder.

One artifact, legible at three levels simultaneously:

- a **human** sees what it is at a glance;
- a **vision model** reads the manifest *from the pixels* — it knows what's
  inside and can ask its runtime to decode, without any skill pre-installed;
- the **runtime** decodes the actual bytes.

Self-bootstrapping in any LLM chat UI — and image upload is the *only* rich
attachment universally supported across LLM products, while file support is
inconsistent everywhere. Degrades gracefully: if a hostile pipeline re-encodes
the image and destroys the payload, the visible manifest survives.

### 4. Mobile's locked-down channels

On iOS especially, images flow where files can't: clipboard between sandboxed
apps, the share sheet, iMessage, and — critically — the **camera roll, which
syncs across devices for free**. An app that persists state as images gets
cross-device sync with zero backend. Weird, slightly gross, genuinely useful —
the niche where a format wins by being the only thing that works.

### 5. The browser's image privileges as a perf primitive

The HTML preload scanner discovers `<img>` before JS executes — a TokenPack
`<img>` starts fetch+decode during HTML parse, earlier than any JS-initiated
fetch. Combined with off-main-thread decode and streaming overlap: a narrow but
*measurable* class of wins — critical data hydration, font/asset capsules,
SW-cache repeat visits. The one place claims are benchmarkable rather than
narrative.

### 6. Optical: the dense QR

Camera-readable at ~3 orders of magnitude denser than QR. Paying niches:
air-gapped signing ceremonies (crypto custody currently uses *animated QR
sequences*), data diodes in secure facilities, paper key escrow, archival cold
storage. Hard channel (lens distortion, moiré — needs serious FEC), small
market, zero competition, desperate users.

## Anti-use-cases (explicitly not chasing)

- **The image as costume.** If the channel accepts blobs, a blob wins. Most
  "faster than brotli over HTTP" framings die here.
- **Hostile pipelines.** Twitter, WhatsApp, Google Photos recompress lossily
  and silently murder payloads. Either target PNG-preserving channels (GitHub,
  Discord, Slack, iMessage) or treat survival-under-recompression as the hard
  R&D problem it is.
- **The exfiltration shape.** Data-in-images through file-blocking channels is
  also a DLP-evasion technique. Decide the project's stance early (loud magic
  bytes, scanner-friendly markers) — security vendors will notice before
  customers do.

## North star

The three winners share one principle: **the image must be a real image of the
thing inside it** — a view, a preview, a manifest. When pixels and payload are
two representations of the same object, the format stops being a gimmick and
becomes the only artifact that serves humans, vision models, and runtimes at
once. When the pixels are just noise wrapping bytes, a zip was always the
better answer.

## Landing-page implications (for the revision)

- Lead with the three winners: screenshot-with-payload, preview-is-the-file,
  vision-legible attachments. Demote/retire cases where image-ness is cosmetic.
- Cite the Spore / ComfyUI precedents — they are the strongest social proof
  the core pattern works.
- State the north-star principle on the page; it doubles as honest scoping.
- Keep the hostile-pipeline caveat visible (which channels preserve payloads).
