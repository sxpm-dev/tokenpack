import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const guides = JSON.parse(
  await readFile(new URL('../../../docs/guides/index.json', import.meta.url), 'utf8'),
)
const base = process.env.GUIDES_URL || 'http://localhost:3103'
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const guide of guides) {
    const response = await page.goto(`${base}/use-cases/${guide.slug}`)
    assert.equal(response.status(), 200)
    await page.getByRole('heading', { level: 1, name: guide.title }).waitFor()
    await page.getByRole('button', { name: 'Verify example in browser' }).click()
    await page
      .getByRole('status')
      .filter({ hasText: /^Verified \d+ files/ })
      .waitFor({ timeout: 30000 })
    console.log(`${guide.slug}: browser decode and checksums passed`)
  }
  const missing = await page.goto(`${base}/use-cases/not-a-workflow`)
  assert.equal(missing.status(), 404)
  await page.goto(`${base}/use-cases`)
  assert.equal(await page.locator('main ol > li').count(), 10)
  await page.screenshot({ path: '/tmp/codeart-guides-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}/use-cases/portable-app`)
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    'Mobile page overflows',
  )
  await page.screenshot({ path: '/tmp/codeart-guides-mobile.png', fullPage: true })
  await page.getByRole('button', { name: 'Verify example in browser' }).click()
  await page
    .getByRole('status')
    .filter({ hasText: /^Verified 4 files/ })
    .waitFor()
  await page.route('**/examples/workflows/portable-app.png', route => route.fulfill({ status: 404 }))
  await page.getByRole('button', { name: 'Verify example in browser' }).click()
  await page.getByRole('status').filter({ hasText: 'Example files are unavailable' }).waitFor()
  await page.unroute('**/examples/workflows/portable-app.png')
  await page.getByRole('button', { name: 'Verify example in browser' }).click()
  await page.getByRole('status').filter({ hasText: /^Verified 4 files/ }).waitFor()
  // Assert the documented app behavior separately from decoding.
  await page.setContent(
    await readFile(
      new URL('../../../examples/workflows/portable-app/app/index.html', import.meta.url),
      'utf8',
    ),
  )
  assert.equal(await page.locator('#total').textContent(), 'Monthly cost: $48')
  await page.locator('#seats').fill('5')
  assert.equal(await page.locator('#total').textContent(), 'Monthly cost: $60')
  assert.deepEqual(errors, [])
  console.log('Index, 404, mobile layout, portable app behavior and browser errors passed')
} finally {
  await browser.close()
}
