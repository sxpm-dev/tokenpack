'use client'

import { useEffect, useState } from 'react'

import { ALGO_CATALOG, type AlgoMeta, mergeNodeCatalog } from './algo-catalog'
import { isStaticSite } from './site-path'

let cachedCatalog: AlgoMeta[] | null = null
let catalogPromise: Promise<AlgoMeta[]> | null = null

async function loadCatalog(): Promise<AlgoMeta[]> {
  if (isStaticSite) return ALGO_CATALOG
  if (cachedCatalog) return cachedCatalog
  if (!catalogPromise) {
    catalogPromise = fetch('/api/algorithms')
      .then(async res => {
        if (!res.ok) return ALGO_CATALOG
        const data = (await res.json()) as { algorithms?: AlgoMeta[] }

        return data.algorithms ? mergeNodeCatalog(ALGO_CATALOG, data.algorithms) : ALGO_CATALOG
      })
      .then(catalog => {
        cachedCatalog = catalog

        return catalog
      })
      .catch(() => ALGO_CATALOG)
  }

  return catalogPromise
}

export function usePlaygroundAlgorithms(): AlgoMeta[] {
  const [catalog, setCatalog] = useState(cachedCatalog ?? ALGO_CATALOG)

  useEffect(() => {
    let cancelled = false

    loadCatalog().then(next => {
      if (!cancelled) setCatalog(next)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return catalog
}
