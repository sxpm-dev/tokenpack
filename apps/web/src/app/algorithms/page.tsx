'use client'

import { useState } from 'react'

import { usePlaygroundAlgorithms } from '@/lib/use-playground-algorithms'

import { AlgoCard } from './components/AlgoCard'
import { AlgorithmFilters } from './components/AlgorithmFilters'

export default function AlgorithmsPage() {
  const catalog = usePlaygroundAlgorithms()
  const [browserOnly, setBrowserOnly] = useState(false)
  const [streamOnly, setStreamOnly] = useState(false)

  const filtered = catalog.filter(a => {
    if (browserOnly && (!a.implementedIn.includes('browser') || a.feFriendly === 'no')) return false
    if (streamOnly && a.streamFriendly === 'no') return false

    return true
  })

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Algorithms</h1>
        <p className="mt-0.5 text-xs text-tp-muted">
          {catalog.length} benchmark-qualified algorithms
        </p>
      </div>

      <AlgorithmFilters
        browserOnly={browserOnly}
        filteredCount={filtered.length}
        streamOnly={streamOnly}
        totalCount={catalog.length}
        onBrowserOnlyChange={setBrowserOnly}
        onStreamOnlyChange={setStreamOnly}
      />

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-tp-muted text-sm">
          No algorithms match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(a => (
            <AlgoCard key={a.id} algo={a} />
          ))}
        </div>
      )}
    </div>
  )
}
