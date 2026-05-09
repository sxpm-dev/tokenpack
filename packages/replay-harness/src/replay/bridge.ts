import type { Page } from 'playwright'

/**
 * Inject the manifest's pack-URL map and the bundled strategy script into the
 * page so it runs before any page code. The strategy registers a single
 * window function — `__getPackFile(packId, internalPath)` — that the Node-side
 * Fetch.requestPaused handler invokes via `page.evaluate`.
 */
export async function installStrategy(
  page: Page,
  packUrls: Readonly<Record<string, string>>,
  bootstrapBundle: string,
): Promise<void> {
  await page.addInitScript({
    content: `window.__PACK_URLS=${JSON.stringify(packUrls)};`,
  })
  await page.addInitScript({ content: bootstrapBundle })
}
