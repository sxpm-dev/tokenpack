import type { CaseId, LoadScope } from './benchConfig'

export function scenarioPseudo(caseId: CaseId, scope: LoadScope): readonly string[] {
  const selectLine =
    scope === 'random'
      ? 'const selected = selectRandom50(manifest.eager)'
      : 'const selected = selectAll(manifest.eager)'
  const selectComment =
    scope === 'random' ? '// seeded 50% request set' : '// full eager app request set'

  if (caseId === 'router')
    return [
      "const router = await decodeRouter('/assets/router/router.png')",
      selectComment,
      selectLine,
      'const files = await router.materialize(selected.paths)',
      'createScriptsAndStyles(files); createImages(files)',
      '// lazy button click',
      'button.onclick = () => router.materialize(lazyPaths)',
    ]

  if (caseId === 'multi')
    return [
      'const manifest = await loadManifest()',
      selectComment,
      selectLine,
      'for (const path of selected.js)',
      '  injectScript(await fetchText(path))',
      'for (const path of selected.css)',
      '  injectStyle(await fetchText(path))',
      'for (const path of selected.images)',
      '  new Image().src = path',
    ]

  if (caseId === 'single')
    return [
      'const manifest = await loadManifest()',
      selectComment,
      selectLine,
      '<link rel="stylesheet" href="bundle.css" />',
      '// full eager JS bundle',
      '<script src="bundle.js"></script>',
      'renderSelectedModules(selected.js)',
      'for (const path of selected.images)',
      '  new Image().src = path',
      '// lazy button click',
      'button.onclick = () => load(lazyJs, lazyCss, lazyImages)',
    ]

  if (caseId === 'native-chunks') {
    const buildLine =
      scope === 'random'
        ? 'buildHtml(selectRandom50(manifest.eager))'
        : 'buildHtml(selectAll(manifest.eager))'
    const buildComment =
      scope === 'random' ? '// native-chunks-random.html' : '// native-chunks.html'

    return [
      buildComment,
      buildLine,
      '<script>globalThis.__BENCH_START = performance.now()</script>',
      '<link rel="stylesheet" href="style-0001.css" />',
      '<script src="mod-0001.js"></script>',
      '<img src="img-small-0001.png" />',
      'renderSelectedModules(loadedScripts)',
      '// lazy button click',
      'button.onclick = () => loadLazyChunks()',
    ]
  }

  return [
    scope === 'random' ? '// native-single-random.html' : '// native-single.html',
    scope === 'random'
      ? 'buildHtml(selectRandom50(manifest.images))'
      : 'buildHtml(selectAll(manifest.images))',
    '<script>globalThis.__BENCH_START = performance.now()</script>',
    '<link rel="stylesheet" href="bundle.css" />',
    '// full app JS bundle',
    '<script src="entry-all.js"></script>',
    '<img src="selected-image.png" />',
    'renderSelectedModules(loadedBundle)',
    '// lazy button click',
    'button.onclick = () => fetchLazyImages().then(renderScene)',
  ]
}
