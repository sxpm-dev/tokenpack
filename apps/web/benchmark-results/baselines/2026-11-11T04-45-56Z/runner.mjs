import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
const out = process.env.BASELINE_DIR
if (!out) throw new Error('BASELINE_DIR is required')
fs.mkdirSync(path.join(out, 'playgrounds'), { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.setDefaultTimeout(30000)
const report = { startedAt: new Date().toISOString(), browser: browser.version(), node: process.version, jobs: [] }
const errors = []
page.on('pageerror', e => errors.push(e.message))
const base = process.env.BENCH_URL || 'http://localhost:3003'
const checkpoint = () => fs.writeFileSync(path.join(out, 'playground-coverage.json'), JSON.stringify(report, null, 2))
function failures(v, loc = 'result') {
  if (!v || typeof v !== 'object') return []
  const found = []
  if (v.error || ['error','failed'].includes(v.state) || ['error','failed'].includes(v.status) || v.ok === false || v.verified === false || (typeof v.verify === 'string' && v.verify !== 'ok')) found.push({ location: loc, value: v })
  for (const [k, x] of Object.entries(v)) if (x && typeof x === 'object') found.push(...failures(x, `${loc}.${k}`))
  return found
}
async function visit(route) {
  const res = await page.goto(base + route)
  if (!res.ok()) throw new Error(`${route}: HTTP ${res.status()}`)
  await page.waitForLoadState('networkidle')
}
async function options(selector = 'select', nth = 0) {
  return page.locator(selector).nth(nth).locator('option').evaluateAll(nodes => nodes.map(n => n.value))
}
async function run(id, button) {
  await page.waitForLoadState('networkidle')
  const startedAt = new Date().toISOString()
  const job = { id, route: new URL(page.url()).pathname, startedAt }
  try {
    const pending = page.waitForResponse(r => r.url().endsWith('/api/bench-runs') && r.request().method() === 'POST', { timeout: 300000 })
    pending.catch(() => {})
    await page.getByRole('button', { name: button, exact: typeof button === 'string' }).click()
    const response = await pending
    if (!response.ok()) throw new Error(`Save HTTP ${response.status()}`)
    const saved = await response.json()
    if (saved.mode !== 'production' || !Object.keys(saved.result).length) throw new Error('Expected nonempty production result')
    job.file = `playgrounds/${id}.json`
    fs.writeFileSync(path.join(out, job.file), JSON.stringify(saved, null, 2))
    job.failures = failures(saved.result)
    job.browserErrors = errors.splice(0)
    job.status = job.failures.length || job.browserErrors.length ? 'failed' : 'passed'
  } catch (e) { job.status = 'failed'; job.error = e.message }
  job.finishedAt = new Date().toISOString()
  report.jobs.push(job); checkpoint()
  console.log(`${report.jobs.length} ${job.status} ${id}`)
}
try {
  await visit('/json-playground')
  const records = await page.getByRole('combobox', { name: 'Indexed JSON path' }).locator('option').evaluateAll(ns => ns.map(n => n.value).filter(Boolean))
  for (const id of records) {
    await page.getByRole('combobox', { name: 'Indexed JSON path' }).selectOption(id)
    await run(`json-${id.replaceAll(':','-')}`, 'Compare access methods')
  }
  for (const [tab, name] of [['Source content', /Run source/], ['Exact files', /Run exact/], ['Generated script', /Run script/]]) {
    await visit('/browser-fetch-bench')
    await page.getByRole('button', { name: new RegExp(tab) }).click()
    for (const source of await options()) {
      await page.locator('select').first().selectOption(source)
      await run(`browser-${tab.split(' ')[0]}-${source}`, name)
    }
  }
  await visit('/apply-diff-bench')
  for (const strategy of await options()) {
    await page.locator('select').nth(0).selectOption(strategy)
    for (const id of await options('select', 1)) {
      await page.locator('select').nth(1).selectOption(id)
      await run(`apply-${id}`, 'Run case')
    }
  }
  await visit('/scenarios/diff-versioning'); await run('diff-matrix', 'Run matrix')
  for (const id of ['inline-data-uri','stream-boot','sw-cache']) {
    await visit(`/scenarios/${id}`)
    for (const size of [10,100,1000]) {
      await page.getByText(`${size} KB`, { exact: true }).click()
      await run(`${id}-${size}`, 'Run')
    }
  }
  await visit('/scenarios/ssr-streaming'); await run('ssr-streaming', 'Run')
  await visit('/scenarios/component-bundle'); await run('component-bundle', 'Run all')
  await visit('/partial-fetch')
  for (const mode of await options('select', 1)) {
    await page.locator('select').nth(1).selectOption(mode)
    for (const target of await options()) {
      await page.locator('select').nth(0).selectOption(target)
      for (let repeat = 1; repeat <= 5; repeat++) await run(`partial-${mode}-${target}-${repeat}`, 'Run all strategies')
    }
  }
  for (const size of ['Small','Medium','Large']) for (const scope of ['Full app','50% random']) for (const cache of ['Cold','Warm']) {
    await visit('/benchmarks/app')
    for (const label of [size, scope, cache]) await page.getByRole('button', { name: new RegExp('^' + label) }).click()
    for (const label of ['Router materialize','Manifest chunks','Manifest bundle','Native chunks','Native single']) {
      await page.getByRole('button', { name: new RegExp('^' + label) }).click()
      await run(`app-${size}-${scope.split(' ')[0]}-${cache}-${label.replaceAll(' ','-')}`, /^(Re-run|Run) bench$/i)
    }
  }
} catch(e) { report.fatalError = e.stack; console.error(e) }
finally {
  report.finishedAt = new Date().toISOString()
  report.status = report.fatalError || report.jobs.some(j => j.status === 'failed') ? 'failed' : 'passed'
  checkpoint(); await browser.close()
}
if (report.status !== 'passed') process.exitCode = 1
