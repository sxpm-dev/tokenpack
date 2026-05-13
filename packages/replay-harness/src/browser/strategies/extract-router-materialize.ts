// Strategy: router token + browser materialization API.
//
// The replay harness still intercepts real app requests through CDP, but file
// placement and chunk loading are owned by the router token decoded in-browser.

import { decodeRouter, type RouterToken } from '@tokenpack/browser'

declare global {
  interface Window {
    __PACK_URLS: Record<string, string>
    __getPackFile: (
      packId: string,
      internalPath: string,
    ) => Promise<{
      text: string
      packFetchMs: number
      packInitMs: number
      fileFetchMs: number
      extractMs: number
      cacheState: 'miss' | 'pending' | 'hit'
    }>
  }
}

const ROUTER_TOKEN_ID = '__router'

let router: RouterToken | null = null
let routerReady: Promise<RouterToken> | null = null
const loadedText = new Map<string, Promise<string>>()
let routerSettled = false

window.__getPackFile = async (_packId, internalPath) => {
  const cacheState: 'miss' | 'pending' | 'hit' = !routerReady
    ? 'miss'
    : routerSettled
      ? loadedText.has(internalPath)
        ? 'hit'
        : 'miss'
      : 'pending'
  const initStart = performance.now()
  const pack = await getRouter()
  const packInitMs = performance.now() - initStart
  const fileStart = performance.now()
  let promise = loadedText.get(internalPath)

  if (!promise) {
    promise = pack.text(internalPath, { strategy: 'auto' })
    loadedText.set(internalPath, promise)
  }

  const text = await promise
  const fileFetchMs = performance.now() - fileStart
  const t1 = performance.now()
  const extractMs = performance.now() - t1

  return {
    text,
    packFetchMs: packInitMs + fileFetchMs,
    packInitMs,
    fileFetchMs,
    extractMs,
    cacheState,
  }
}

async function getRouter(): Promise<RouterToken> {
  if (router) return router
  if (!routerReady) {
    const routerUrl = window.__PACK_URLS[ROUTER_TOKEN_ID]

    if (!routerUrl) throw new Error('router token URL missing from __PACK_URLS.__router')
    routerReady = Promise.resolve(decodeRouter(routerUrl))
    routerReady
      .then(value => {
        router = value
        routerSettled = true
      })
      .catch(() => {
        routerSettled = true
      })
  }

  return routerReady
}

export {}
