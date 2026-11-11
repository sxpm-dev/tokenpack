import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { selectBenchEntries } from '../src/benchScope.js'
import { ASSET_BASE, FIXTURE_BASE, FIXTURE_DIR, FIXTURE_SIZE } from './paths.js'

mkdirSync(FIXTURE_DIR, { recursive: true })

interface ManifestEntry {
  id?: number
  path: string
}

interface ManifestImageEntry extends ManifestEntry {
  kind: 'image'
}

interface Manifest {
  modules: ManifestEntry[]
  styles?: ManifestEntry[]
  assets?: ManifestImageEntry[]
  lazyModules?: ManifestEntry[]
  lazyStyles?: ManifestEntry[]
  lazyAssets?: ManifestImageEntry[]
}

const manifest = JSON.parse(
  readFileSync(join(FIXTURE_DIR, 'assets', 'manifest.json'), 'utf8'),
) as Manifest
const eagerEntries = {
  modules: manifest.modules,
  styles: manifest.styles ?? [],
  assets: manifest.assets ?? [],
}

writeFileSync(
  join(FIXTURE_DIR, 'index.html'),
  htmlShell('bench-app', `${FIXTURE_BASE}/bootloader.js`),
)
writeFileSync(
  join(FIXTURE_DIR, 'native-chunks.html'),
  nativeChunksHtml(selectBenchEntries('full', eagerEntries)),
)
writeFileSync(
  join(FIXTURE_DIR, 'native-chunks-random.html'),
  nativeChunksHtml(selectBenchEntries('random', eagerEntries)),
)

console.log(`html shells built · size=${FIXTURE_SIZE}`)

function htmlShell(title: string, scriptSrc: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
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
      #lazy-dialog .scene {
        flex: 1 1 auto; min-height: 320px; background: #080b0b;
        display: flex; align-items: stretch; justify-content: stretch;
      }
      #lazy-dialog .scene canvas { width: 100%; height: 100%; display: block; }
      #lazy-dialog .tags {
        max-height: 28%; overflow: auto; padding: 10px;
        border-top: 1px solid #2a2d30; display: grid;
        grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 6px;
      }
    </style>
  </head>
  <body>
    ${benchStartScript()}
    <header>
      <strong>bench-app</strong>
      <span id="status">booting...</span>
      <button id="open-dialog" type="button" disabled>Open 3D preview</button>
    </header>
    <div id="root"></div>
${nativeScriptTag(scriptSrc)}
  </body>
</html>
`
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function benchStartScript(): string {
  return `<script>
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

function nativeChunksHtml(selection: {
  modules: ManifestEntry[]
  styles: ManifestEntry[]
  assets: ManifestImageEntry[]
}): string {
  const styleTags = selection.styles
    .map(s => nativeStylesheetTag(`${ASSET_BASE}/${s.path}`))
    .join('\n')
  const imageTags = selection.assets.map(a => nativeImageTag(`${ASSET_BASE}/${a.path}`)).join('\n')
  const scriptTags = selection.modules
    .map(m => nativeScriptTag(`${ASSET_BASE}/${m.path}`))
    .join('\n')
  const moduleIds = selection.modules.map(m => m.id).filter(id => id !== undefined)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>bench-app · native-chunks</title>
${benchStartScript()}
${baseStyles()}
${styleTags}
  </head>
  <body>
    <header>
      <strong>bench-app</strong>
      <span id="status">booting...</span>
      <button id="open-dialog" type="button" disabled>Open 3D preview</button>
    </header>
    <div id="root"></div>
    <div id="images">
${imageTags}
    </div>
${scriptTags}
    <script>
${nativeChunksRuntime(moduleIds)}
    </script>
  </body>
</html>
`
}

function baseStyles(): string {
  return `    <style>
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
      #lazy-dialog .scene {
        flex: 1 1 auto; min-height: 320px; background: #080b0b;
        display: flex; align-items: stretch; justify-content: stretch;
      }
      #lazy-dialog .scene canvas { width: 100%; height: 100%; display: block; }
      #lazy-dialog .tags {
        max-height: 28%; overflow: auto; padding: 10px;
        border-top: 1px solid #2a2d30; display: grid;
        grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 6px;
      }
    </style>`
}

function nativeStylesheetTag(href: string): string {
  return `    <script>document.write('<link rel="stylesheet" href="' + globalThis.__benchAssetUrl(${JSON.stringify(href)}) + '" />')</script>`
}

function nativeImageTag(src: string): string {
  return `    <script>document.write('<img class="eager-img" src="' + globalThis.__benchAssetUrl(${JSON.stringify(src)}) + '" alt="" />')</script>`
}

function nativeScriptTag(src: string): string {
  return `    <script>document.write('<script src="' + globalThis.__benchAssetUrl(${JSON.stringify(src)}) + '"><\\/script>')</script>`
}

function nativeChunksRuntime(moduleIds: Array<number | undefined>): string {
  const ids = moduleIds.filter(id => id !== undefined)
  const lazyModules = (manifest.lazyModules ?? []).map(m => m.path)
  const lazyStyles = (manifest.lazyStyles ?? []).map(s => s.path)
  const lazyAssets = (manifest.lazyAssets ?? []).map(a => a.path)

  return `;(function () {
  var bootStart = typeof window.__BENCH_START === 'number' ? window.__BENCH_START : performance.now();
  var moduleIds = ${JSON.stringify(ids)};
  var lazyModules = ${JSON.stringify(lazyModules)};
  var lazyStyles = ${JSON.stringify(lazyStyles)};
  var lazyAssets = ${JSON.stringify(lazyAssets)};
  var base = ${JSON.stringify(ASSET_BASE)};

  function setStatus(msg) {
    var el = document.getElementById('status');
    if (el) el.textContent = msg;
  }
  function assetUrl(pathOrUrl) {
    var url = pathOrUrl.indexOf('http') === 0 ? pathOrUrl : base + '/' + pathOrUrl;
    return typeof window.__benchAssetUrl === 'function' ? window.__benchAssetUrl(url) : url;
  }
  function render(ids, bagName, root) {
    var bag = window[bagName] || {};
    ids.forEach(function (id) {
      if (bag[id]) bag[id].render(root);
    });
  }
  function waitImage(img) {
    if (img.complete) return img.decode().catch(function () {});
    return new Promise(function (resolve) {
      img.onload = function () { img.decode().then(resolve, resolve); };
      img.onerror = resolve;
    });
  }
  function collectWireBytes() {
    var totals = { requests: 0, transferBytes: 0, encodedBytes: 0, decodedBytes: 0 };
    performance.getEntriesByType('resource').forEach(function (entry) {
      if (entry.name.indexOf('http') !== 0) return;
      totals.requests += 1;
      totals.transferBytes += entry.transferSize;
      totals.encodedBytes += entry.encodedBodySize;
      totals.decodedBytes += entry.decodedBodySize;
    });
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      totals.requests += 1;
      totals.transferBytes += nav.transferSize;
      totals.encodedBytes += nav.encodedBodySize;
      totals.decodedBytes += nav.decodedBodySize;
    }
    return totals;
  }
  function diffWireBytes(after, before) {
    return {
      requests: after.requests - before.requests,
      transferBytes: after.transferBytes - before.transferBytes,
      encodedBytes: after.encodedBytes - before.encodedBytes,
      decodedBytes: after.decodedBytes - before.decodedBytes,
    };
  }
  var bootBytes = null;
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('script failed: ' + src)); };
      document.head.appendChild(script);
    });
  }
  function loadStyle(href) {
    return new Promise(function (resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = function () { reject(new Error('style failed: ' + href)); };
      document.head.appendChild(link);
    });
  }
  function fetchBitmap(path) {
    return fetch(assetUrl(path), { cache: new URLSearchParams(location.search).get('cache') === 'cold' ? 'no-store' : 'default' })
      .then(function (r) {
        if (!r.ok) throw new Error('image failed: ' + path);
        return r.blob();
      })
      .then(createImageBitmap);
  }
  function boot() {
    var phases = {};
    phases.jsCssMs = performance.now() - bootStart;
    var renderStart = performance.now();
    render(moduleIds, '__BENCH_MODULES', document.getElementById('root'));
    phases.renderMs = performance.now() - renderStart;
    Promise.all(Array.prototype.map.call(document.querySelectorAll('img.eager-img'), waitImage))
      .then(function () {
        phases.imagesMs = performance.now() - bootStart;
        var total = performance.now() - bootStart;
        bootBytes = collectWireBytes();
        window.__BENCH_BYTES = bootBytes;
        window.__BENCH_BOOT_DONE = total;
        window.__BENCH_PHASES = phases;
        setStatus('boot ' + Math.round(total) + ' ms · JS/CSS ' + Math.round(phases.jsCssMs) + ' ms (initial HTML tags) · images ' + Math.round(phases.imagesMs) + ' ms · render ' + Math.round(phases.renderMs) + ' ms');
        setupLazy();
      })
      .catch(function (err) {
        window.__BENCH_ERROR = err && err.message ? err.message : String(err);
        setStatus('boot failed: ' + window.__BENCH_ERROR);
      });
  }
  function setupLazy() {
    var btn = document.getElementById('open-dialog');
    if (!btn) return;
    btn.disabled = false;
    btn.addEventListener('click', openLazy, { once: true });
  }
  function ensureDialog() {
    var dialog = document.createElement('div');
    dialog.id = 'lazy-dialog';
    dialog.innerHTML = '<div class="bar"><span id="lazy-status">loading...</span></div><div class="scene"></div><div class="tags"></div>';
    document.body.appendChild(dialog);
    return dialog;
  }
  function openLazy() {
    var t0 = performance.now();
    var phases = {};
    var dialog = ensureDialog();
    var loadStart = performance.now();
    var tasks = lazyModules.map(function (path) { return loadScript(assetUrl(path)); })
      .concat(lazyStyles.map(function (path) { return loadStyle(assetUrl(path)); }));
    var bitmaps = Promise.all(lazyAssets.map(fetchBitmap));
    Promise.all(tasks.concat([bitmaps])).then(function (results) {
      phases.loadMs = performance.now() - loadStart;
      var renderStart = performance.now();
      render(Object.keys(window.__BENCH_LAZY_MODULES || {}).map(Number), '__BENCH_LAZY_MODULES', dialog.querySelector('.tags'));
      if (window.__BENCH_LAZY && window.__BENCH_LAZY.initScene) {
        window.__BENCH_LAZY.initScene(dialog.querySelector('.scene'), results[results.length - 1] || []);
      }
      phases.renderMs = performance.now() - renderStart;
      window.__BENCH_LAZY_BYTES = bootBytes ? diffWireBytes(collectWireBytes(), bootBytes) : collectWireBytes();
      window.__BENCH_LAZY_DONE = performance.now() - t0;
      window.__BENCH_LAZY_PHASES = phases;
      document.getElementById('lazy-status').textContent = 'done · ' + Math.round(window.__BENCH_LAZY_DONE) + 'ms';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();`
}
