import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(fileURLToPath(new URL('../../.pages-build/out/', import.meta.url)))
const prefix = '/tokenpack'
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
}
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost')
    if (!url.pathname.startsWith(prefix + '/')) {
      response.writeHead(404).end()
      return
    }
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname.slice(prefix.length)))
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Outside static root')
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html')
    response.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream')
    const bytes = await readFile(file)
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
    if (range) {
      const start = Number(range[1]), end = Math.min(range[2] ? Number(range[2]) : bytes.length - 1, bytes.length - 1)
      if (start > end) { response.writeHead(416).end(); return }
      response.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${bytes.length}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' })
      response.end(bytes.subarray(start, end + 1))
    } else { response.setHeader('Content-Length', bytes.length); response.end(bytes) }
  } catch {
    response.writeHead(404).end('Not found')
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = process.env.PAGES_URL || `http://127.0.0.1:${server.address().port}${prefix}`
const browser = await chromium.launch({ headless: true })
const errors = []
let page
try {
  page = await browser.newPage()
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('favicon'))
      errors.push(`${response.status()}: ${response.url()}`)
  })
  for (const route of [
    '/',
    '/docs/quickstart/',
    '/use-cases/',
    '/server-fetch-bench/',
    '/encode-decode-bench/',
    '/experiments/',
  ]) {
    assert.equal((await page.goto(base + route)).status(), 200)
    await page.getByRole('heading', { level: 1 }).first().waitFor()
    if (route.includes('fetch-bench') || route.includes('encode-decode'))
      await page.locator('tbody tr').first().waitFor()
    console.log(`PASS ${route}`)
  }
  for (const route of [
    '/json-playground/',
    '/apply-diff-bench/',
    '/scenarios/diff-versioning/',
  ]) {
    await page.goto(base + route)
    await page.getByRole('link', { name: 'Download complete run JSON' }).waitFor()
    assert((await page.locator('select option').count()) > 0)
    await page.getByText('Complete recorded result', { exact: true }).click()
    assert((await page.locator('details pre').innerText()).length > 100)
    console.log(`PASS ${route} saved results`)
  }
  await page.goto(base + '/browser-fetch-bench/')
  await page.locator('select').first().locator('option').first().waitFor({ state: 'attached' })
  await page.locator('input[type=number]').fill('1')
  for (const [tab, run] of [['Source content', /Run source/], ['Exact files', /Run exact/], ['Generated script', /Run script/]]) {
    await page.getByRole('button', { name: new RegExp(tab, 'i') }).first().click()
    const button = page.getByRole('button', { name: run })
    await button.click()
    await page.waitForFunction(() => !document.querySelector('button svg.animate-spin') && [...document.querySelectorAll('button')].some(b => /^Run (source|exact|script)/i.test((b.textContent ?? '').trim()) && !b.disabled), null, { timeout: 90000 })
    await page.getByRole('button', { name: 'Save as baseline' }).waitFor()
    assert.equal(await page.locator('tbody .text-red-300').count(), 0, await page.locator('tbody').innerText())
    await page.getByRole('button', { name: 'Save as baseline' }).click()
    await page.getByText(/Baseline saved in this browser/).waitFor()
    console.log(`PASS browser fetch ${tab}`)
  }
  await page.goto(base + '/benchmarks/app/')
  await page.getByRole('button', { name: /^Small/ }).click()
  await page.getByRole('button', { name: /^1×/ }).click()
  for (const label of ['Router materialize', 'Manifest chunks', 'Manifest bundle', 'Native chunks', 'Native single']) {
    await page.getByRole('button', { name: new RegExp('^' + label) }).click()
    await page.getByRole('button', { name: /^(Re-run|Run) bench$/i }).click()
    await page.getByRole('button', { name: 'Re-run bench', exact: true }).waitFor({ timeout: 90000 })
    const frame = page.frameLocator('iframe')
    await frame.locator('#root .bench-module').first().waitFor()
    await frame.getByRole('button', { name: /preview/i }).click()
    await frame.locator('#lazy-dialog').waitFor()
    await frame.locator('#lazy-dialog canvas').waitFor({ timeout: 30000 })
    console.log(`PASS application ${label} and preview`)
  }
  const guides = JSON.parse(
    await readFile(new URL('../../../docs/guides/index.json', import.meta.url), 'utf8'),
  )
  for (const { slug } of guides) {
    await page.goto(`${base}/use-cases/${slug}/`)
    await page.getByRole('button', { name: 'Verify example in browser' }).click()
    await page
      .getByRole('status')
      .filter({ hasText: /^Verified \d+ files/ })
      .waitFor({ timeout: 30000 })
  }
  await page.goto(base + '/playground/')
  const text = 'GitHub Pages round trip: Zoë 日本語'
  await page.getByLabel('Payload (UTF-8 text)').fill(text)
  await page.waitForFunction(
    value => [...document.querySelectorAll('pre')].some(node => node.textContent === value),
    text,
  )
  await page.goto(base + '/playground/router/')
  const before = await page.locator('input[type=range]').count()
  await page.getByRole('button', { name: '+ add', exact: true }).click()
  assert.equal(await page.locator('input[type=range]').count(), before + 1)
  await page.goto(base + '/playground/files/')
  await page.getByRole('button', { name: 'Add text', exact: true }).click()
  await page.getByLabel('Entry text content').fill(text)
  await page.getByRole('button', { name: /Best compression.*browser/ }).click()
  await page.getByRole('button', { name: 'Encode', exact: true }).click()
  await page.getByRole('button', { name: 'Open in Explorer', exact: true }).click()
  await page.getByText('note.txt', { exact: true }).first().waitFor()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(base + '/use-cases/configuration/')
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.deepEqual(errors, [])
  console.log(
    'PASS 10 guide verifiers, browser round trip, router planner, file build/explore, mobile layout and no missing assets',
  )
} catch (error) {
  console.error('Failed on', page?.url(), (await page?.locator('body').innerText())?.slice(-5000))
  throw error
} finally {
  await browser.close()
  server.close()
}
