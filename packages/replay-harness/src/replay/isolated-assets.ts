import type { BrowserContext, Route } from 'playwright'

import type { ThrottleConfig } from '../config/types.js'
import { type RecordedAssetStore, simulatedNetworkDelayMs } from '../record/asset-store.js'

export interface IsolatedAssetRouterOptions {
  assetStore?: RecordedAssetStore
  throttle?: ThrottleConfig
  excludeUrls?: ReadonlySet<string>
  serveEntryDocument?: boolean
}

export async function installIsolatedAssetRouter(
  context: BrowserContext,
  options: IsolatedAssetRouterOptions,
): Promise<void> {
  if (!options.assetStore) return

  await context.route('**/*', async route => {
    await fulfillFromAssetStore(route, options)
  })
}

export async function fulfillFromAssetStore(
  route: Route,
  options: IsolatedAssetRouterOptions,
): Promise<void> {
  const url = route.request().url()

  if (options.excludeUrls?.has(url)) {
    await route.fallback().catch(() => route.continue().catch(() => {}))

    return
  }

  const entryDocument =
    options.serveEntryDocument && url === options.assetStore?.entryDocument?.url
      ? options.assetStore.entryDocument
      : undefined
  if (entryDocument) {
    await route.fulfill({
      status: entryDocument.status,
      headers: entryDocument.headers,
      body: entryDocument.body,
    })

    return
  }

  const asset = options.assetStore?.byUrl.get(url)

  if (!asset) {
    await route.fallback().catch(() => route.continue().catch(() => {}))

    return
  }

  if (options.throttle) {
    await new Promise(resolve =>
      setTimeout(
        resolve,
        simulatedNetworkDelayMs(asset.wireBytes ?? asset.rawBytes, options.throttle!),
      ),
    )
  }

  await route.fulfill({
    status: asset.status,
    headers: asset.headers,
    body: asset.body,
  })
}
