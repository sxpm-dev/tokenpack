/**
 * Generate public/native-single.html with eager CSS + selected eager <img>
 * tags pre-rendered into the HTML body so the browser starts fetching them
 * at parse time, before entry-all.js runs.
 * This mirrors a server-rendered page with no client-side image loader.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { selectRandomHalf } from '../src/benchScope.js'
import { ASSET_BASE, ASSETS_DIR, FIXTURE_DIR } from './paths.js'

const cdnBaseArg = process.argv.find(a => a.startsWith('--cdn-base='))
const cdnBase = cdnBaseArg ? cdnBaseArg.slice(cdnBaseArg.indexOf('=') + 1).replace(/\/$/, '') : ''

interface ManifestImageEntry {
  path: string
}

interface Manifest {
  assets?: ManifestImageEntry[]
}

const manifest = JSON.parse(readFileSync(join(ASSETS_DIR, 'manifest.json'), 'utf8')) as Manifest
const eagerImages = manifest.assets ?? []

writeHtml(ASSET_BASE, join(FIXTURE_DIR, 'native-single.html'), eagerImages)
writeHtml(ASSET_BASE, join(FIXTURE_DIR, 'native-single-random.html'), selectRandomHalf(eagerImages))
if (cdnBase) writeHtml(cdnBase, join(FIXTURE_DIR, 'native-single-cdn.html'), eagerImages)
process.exit(0)

function writeHtml(assetBase: string, outPath: string, images: ManifestImageEntry[]): void {
  const imgTags = images.map(a => nativeImageTag(`${assetBase}/${a.path}`)).join('\n')

  const scriptSrc = `${assetBase}/entry-all.js`
  const cssSrc = `${assetBase}/bundle.css`

  const html = `<!doctype html>
<html lang="en">
  <head>
	    <meta charset="utf-8" />
	    <meta name="viewport" content="width=device-width,initial-scale=1" />
	    <title>bench-app · native-single</title>
${benchStartScript()}
${nativeStylesheetTag(cssSrc)}
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        background: #080b0b;
        color: #e8e8e8;
      }
      header {
        position: sticky; top: 0; z-index: 10;
        display: grid; grid-template-columns: max-content minmax(0, 1fr) max-content; gap: 14px; align-items: center;
        padding: 12px 16px; background: rgba(14,14,16,.96); border-bottom: 1px solid #24272a;
      }
      header strong { display: block; font-size: 13px; letter-spacing: .02em; white-space: nowrap; }
      #status {
        display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        color: #9b9da3;
      }
      #open-dialog {
        min-width: 156px; padding: 8px 12px; background: #9ee559; color: #10120f;
        border: 1px solid #b9f37d; border-radius: 6px; font: inherit; cursor: pointer;
        white-space: nowrap;
      }
      #open-dialog:hover:not(:disabled) { filter: brightness(1.04); }
      #open-dialog:disabled { background: #17191b; border-color: #2a2d30; color: #666; cursor: not-allowed; }
      #root {
        padding: 14px 16px 10px; display: grid;
        grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 6px;
      }
      .bench-module {
        min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        padding: 6px 7px; border: 1px solid hsl(var(--h) 52% 38% / .75);
        border-left-width: 3px; border-radius: 6px; background: hsl(var(--h) 32% 18% / .72);
        color: #f5f5f5; font-size: 10.5px; line-height: 1;
      }
      .bench-module-lazy { background: hsl(var(--h) 40% 20% / .85); border-style: dashed; }
      #images {
        padding: 12px 16px 24px; display: grid;
        grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 6px;
      }
      #images img {
        width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block;
        border-radius: 6px; border: 1px solid #25282b; background: #111416;
      }
      #lazy-dialog {
        position: fixed; top: 10%; left: 10%; right: 10%; bottom: 10%;
        background: #111315; border: 1px solid #2a2d30; border-radius: 8px;
        box-shadow: 0 20px 60px rgba(0,0,0,.6); z-index: 20;
        display: flex; flex-direction: column; overflow: hidden;
      }
      #lazy-dialog .bar {
        padding: 10px 12px; background: #181b1d; border-bottom: 1px solid #2a2d30;
      }
      #lazy-dialog #lazy-status { color: #9ad; }
      #lazy-dialog .scene { flex: 1 1 auto; min-height: 320px; background: #080b0b; }
      #lazy-dialog .scene canvas { width: 100%; height: 100%; display: block; }
      #lazy-dialog .tags {
        max-height: 28%; overflow: auto; padding: 10px;
        border-top: 1px solid #2a2d30; display: grid;
        grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 6px;
      }
    </style>
  </head>
  <body>
    <header>
      <strong>bench-app</strong>
      <span id="status">booting…</span>
      <button id="open-dialog" type="button" disabled>Open 3D preview</button>
    </header>
    <div id="root"></div>
    <div id="images">
${imgTags}
    </div>
${nativeScriptTag(scriptSrc)}
  </body>
</html>
`

  writeFileSync(outPath, html)

  console.log(
    `${outPath.split('/').pop()} · base=${assetBase} · ${images.length} inline <img> · ${(html.length / 1024).toFixed(1)} KB`,
  )
}

function benchStartScript(): string {
  return `	    <script>
globalThis.__BENCH_START = performance.now();
// Default 250-entry buffer drops resource-timing entries on the large
// fixture, silently under-counting wire bytes. Raise before assets load.
performance.setResourceTimingBufferSize(20000);
globalThis.__benchAssetUrl = function (rawUrl) {
  var params = new URLSearchParams(location.search);
  if (params.get('cache') !== 'cold') return rawUrl;
  var url = new URL(rawUrl, location.href);
  url.searchParams.set('benchRun', params.get('run') || String(Date.now()));
  return url.href;
};
	    </script>`
}

function nativeStylesheetTag(href: string): string {
  return `	    <script>document.write('<link data-bench-eager-css rel="stylesheet" href="' + globalThis.__benchAssetUrl(${JSON.stringify(href)}) + '" />')</script>`
}

function nativeImageTag(src: string): string {
  return `    <script>document.write('<img class="eager-img" src="' + globalThis.__benchAssetUrl(${JSON.stringify(src)}) + '" alt="" />')</script>`
}

function nativeScriptTag(src: string): string {
  return `    <script>document.write('<script src="' + globalThis.__benchAssetUrl(${JSON.stringify(src)}) + '"><\\/script>')</script>`
}
