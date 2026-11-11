'use client'
import { useEffect, useState } from 'react'
export function BenchmarkProvenance() {
  const [run, setRun] = useState<{ createdAt: string; node: string } | null>(null)

  useEffect(() => {
    fetch('/api/benchmark/provenance')
      .then(response => response.json())
      .then(setRun)
      .catch(() => setRun(null))
  }, [])

  return (
    <p className="mx-auto max-w-6xl px-5 pt-4 text-xs text-tp-muted">
      {run
        ? `Measured ${new Date(run.createdAt).toLocaleString()} · Node ${run.node}. Fixture encode and archive timings are single samples; codec decode and fetch timings use warmups and repeated samples.`
        : 'No verified measurement provenance is available. Regenerate the benchmark results.'}
    </p>
  )
}
