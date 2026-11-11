import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const only = process.env.BENCH_ONLY
const skip = (process.env.BENCH_SKIP ?? '').split(',')
const base = process.env.BENCH_URL ?? 'http://localhost:3003'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.setDefaultTimeout(30000)
const errors = []
const reportPath = 'benchmark-results/playground-verification.json'
const report = (only || process.env.BENCH_SKIP) && fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')).report : []
let failure = null
page.on('pageerror', error => errors.push(error.message))
function failures(value, location = 'result') {
  if (!value || typeof value !== 'object') return []
  const found = []
  if (value.error) found.push(`${location}: ${JSON.stringify(value.error)}`)
  if (value.kind === 'error' || value.status === 'error' || value.status === 'failed' || value.verified === false || value.ok === false || (typeof value.verify === 'string' && value.verify !== 'ok')) found.push(`${location}: ${JSON.stringify(value)}`)
  for (const [key, child] of Object.entries(value)) if (typeof child === 'object') found.push(...failures(child, `${location}.${key}`))
  return found
}
async function visit(route) {
  const response = await page.goto(base + route)
  assert(response.ok(), `${route}: HTTP ${response.status()}`)
  await page.waitForLoadState('networkidle')
}
async function run(route, name, setup) {
  if ((only && !route.includes(only)) || skip.includes(route)) return
  await visit(route)
  if (setup) await setup()
  const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/bench-runs') && response.request().method() === 'POST', { timeout: 300000 })
  await page.getByRole('button', { name, exact: typeof name === 'string' }).click()
  const response = await savedResponse
  assert(response.ok(), `Saving ${route}: ${response.status()}`)
  const saved = await response.json()
  assert.equal(saved.mode, 'production')
  assert(Object.keys(saved.result).length > 0, `Empty measurement: ${route}`)
  assert.deepEqual(failures(saved.result), [], route)
  const text = await page.locator('body').innerText()
  assert(!text.includes('Run failed:') && !text.includes('Retried once without success'), text.slice(-3000))
  const restored = await page.request.get(`${base}/api/bench-runs?scope=${saved.scope}&config=${encodeURIComponent(saved.config)}`)
  assert.deepEqual((await restored.json()).result, saved.result, `Restore ${route}`)
  const reloadResponse = page.waitForResponse(response => {
    const url = new URL(response.url())
    return url.pathname === '/api/bench-runs' && url.searchParams.get('scope') === saved.scope && url.searchParams.get('config') === saved.config
  })
  await page.reload()
  if (setup) await setup()
  assert.deepEqual((await (await reloadResponse).json()).result, saved.result, `Reload ${route}`)
  if (route === '/partial-fetch') await page.getByText(saved.result[0].result, { exact: true }).first().waitFor()
  else await page.waitForFunction(() => /\d(?:\.\d+)?\s*(?:ms|µs)/.test(document.body.innerText))
  assert.deepEqual(errors.splice(0), [], `Browser errors on ${route}`)
  report.push({ route, config: JSON.parse(saved.config), createdAt: saved.createdAt, resultCount: Array.isArray(saved.result) ? saved.result.length : Object.keys(saved.result).length })
  console.log(`PASS ${route} ${saved.config}`)
}
try {
  for (const route of ['/server-fetch-bench', '/encode-decode-bench', '/experiments', '/playground', '/playground/router', '/playground/files']) {
    if ((only && !route.includes(only)) || skip.includes(route)) continue
    await visit(route)
    if (route === '/playground') {
      for (const algo of ['linear-deflate', 'linear-stream-deflate', 'pixel-range-deflate', 'pixel-range-none']) {
        const payload = JSON.stringify({ scenario: 'customer-profile', algo, name: 'Zoë 日本語', items: Array.from({ length: 30 }, (_, id) => ({ id, status: 'active' })) })
        await page.getByRole('combobox').first().selectOption(algo)
        await page.getByLabel('Payload (UTF-8 text)').fill(payload)
        await page.waitForFunction(expected => [...document.querySelectorAll('pre')].some(node => node.textContent === expected), payload)
      }
    }
    if (route === '/playground/router') {
      const before = await page.locator('input[type=range]').count()
      await page.getByRole('button', { name: '+ add', exact: true }).click()
      assert.equal(await page.locator('input[type=range]').count(), before + 1)
    }
    if (route === '/playground/files') {
      await page.getByRole('button', { name: 'Add text', exact: true }).click()
      await page.getByLabel('Entry text content').fill('Customer record: Zoë 日本語')
      await page.getByRole('button', { name: 'Encode', exact: true }).click()
      await page.getByRole('button', { name: 'Open in Explorer', exact: true }).click()
      await page.getByText('note.txt', { exact: true }).first().waitFor()
      await page.getByRole('tab', { name: 'Diff', exact: true }).click()
      await page.getByRole('tab', { name: 'Generate', exact: true }).click()
      await page.getByRole('button', { name: 'Add text', exact: true }).nth(0).click()
      await page.getByRole('button', { name: 'Add text', exact: true }).nth(1).click()
      await page.getByLabel('Entry text content').nth(0).fill('Customer status: pending')
      await page.getByLabel('Entry text content').nth(1).fill('Customer status: active')
      await page.getByRole('button', { name: /Best compression.*browser/ }).click()
      await page.getByRole('button', { name: 'Generate diff', exact: true }).click()
      await page.getByRole('link', { name: 'Download', exact: true }).first().waitFor()
      assert((await page.getByRole('link', { name: 'Download', exact: true }).count()) >= 3)
    }
    assert.deepEqual(errors.splice(0), [], route)
    report.push({ route, loaded: true })
    console.log(`PASS ${route} controls`)
  }
  await run('/json-playground', 'Compare access methods')
  await run('/json-playground', 'Compare access methods', async () => page.getByRole('combobox', { name: 'Indexed JSON path' }).selectOption('collection:2517'))
  await run('/browser-fetch-bench', /Run source/)
  await run('/browser-fetch-bench', /Run exact/, async () => page.getByRole('button', { name: /Exact files/ }).click())
  await run('/browser-fetch-bench', /Run script/, async () => page.getByRole('button', { name: /Generated script/ }).click())
  await run('/browser-fetch-bench', /Run source/, async () => page.locator('select').first().selectOption('app-bundle__chunks-5'))
  await run('/apply-diff-bench', 'Run case')
  await run('/apply-diff-bench', 'Run case', async () => {
    await page.locator('select').nth(0).selectOption('five-bundles')
    await page.locator('select').nth(1).selectOption('five-bundles__size-5000kb__updated-1of5')
  })
  await run('/scenarios/diff-versioning', 'Run matrix')
  if (page.url().endsWith('/scenarios/diff-versioning')) await page.screenshot({ path: '/tmp/codeart-production-diff-matrix.png', fullPage: true })
  for (const id of ['inline-data-uri', 'stream-boot', 'sw-cache', 'ssr-streaming']) await run(`/scenarios/${id}`, 'Run')
  for (const id of ['inline-data-uri', 'stream-boot', 'sw-cache']) await run(`/scenarios/${id}`, 'Run', async () => page.getByText('1000 KB', { exact: true }).click())
  await run('/scenarios/component-bundle', 'Run all')
  await run('/partial-fetch', 'Run all strategies')
  await run('/partial-fetch', 'Run all strategies', async () => page.locator('select').nth(1).selectOption('js-fetch'))
  for (const label of ['Router materialize', 'Manifest chunks', 'Manifest bundle', 'Native chunks', 'Native single']) {
    await run('/benchmarks/app', 'Run bench', async () => page.getByRole('button', { name: new RegExp('^' + label) }).click())
  }
} catch (error) {
  failure = error.message
  console.error('Failure on', page.url(), (await page.locator('body').innerText()).slice(-2400))
  throw error
} finally {
  fs.mkdirSync('benchmark-results', { recursive: true })
  fs.writeFileSync('benchmark-results/playground-verification.json', JSON.stringify({ createdAt: new Date().toISOString(), browser: browser.version(), base, status: failure ? 'failed' : 'passed', failure, report, errors }, null, 2))
  await browser.close()
}
