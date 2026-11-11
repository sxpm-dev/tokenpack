'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { sitePath } from '@/lib/site-path'

type Entry = { file: string; scope: string; config: unknown }
type RecordData = { result?: unknown; config?: unknown; [key: string]: unknown }

export function SavedBenchmarks({ title, scopes }: { title: string; scopes: string[] }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [selected, setSelected] = useState('')
  const [record, setRecord] = useState<RecordData | null>(null)
  const [error, setError] = useState('')
  const scopeKey = scopes.join(',')

  useEffect(() => {
    let active = true

    fetch(sitePath('/saved-benchmarks/index.json'))
      .then(async response => {
        if (!response.ok) throw new Error('Saved benchmark index is unavailable.')
        const all = (await response.json()) as Entry[]
        const matching = all.filter(entry => scopeKey.split(',').includes(entry.scope))

        if (active) {
          setEntries(matching)
          setSelected(matching[0]?.file ?? '')
        }
      })
      .catch(error => {
        if (active) setError(String(error))
      })

    return () => {
      active = false
    }
  }, [scopeKey])

  useEffect(() => {
    if (!selected) return
    let active = true

    fetch(sitePath(`/saved-benchmarks/playgrounds/${encodeURIComponent(selected)}`))
      .then(async response => {
        if (!response.ok) throw new Error('Saved benchmark record is unavailable.')
        const data = (await response.json()) as RecordData

        if (active) setRecord(data)
      })
      .catch(error => {
        if (active) setError(String(error))
      })

    return () => {
      active = false
    }
  }, [selected])

  const rows = Array.isArray(record?.result) ? (record.result as Record<string, unknown>[]) : []
  const columns = [
    ...new Set(rows.flatMap(row => Object.keys(row).filter(key => typeof row[key] !== 'object'))),
  ]

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-medium">{title}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-tp-muted">
        Saved measurements from the runtime-optimized baseline, 11 November 2026. These are recorded
        local runs, not measurements of this GitHub Pages site. Server-dependent runs remain
        available with <code>yarn app</code> in the repository.
      </p>
      <p className="mt-3 text-sm">
        <Link className="underline" href="/playground">
          Browser encode / decode
        </Link>{' '}
        and{' '}
        <Link className="underline" href="/use-cases">
          workflow examples
        </Link>{' '}
        run here without a server.
      </p>
      <p className="mt-3 text-sm">
        <a className="underline" href={sitePath('/saved-benchmarks/REPORT.md')}>
          Baseline analysis and known limitations
        </a>
      </p>
      <label className="mt-8 block text-sm">
        Saved configuration ({entries.length})
        <select
          className="mt-2 block w-full rounded border border-tp-border bg-tp-bg p-3"
          value={selected}
          onChange={event => {
            setRecord(null)
            setError('')
            setSelected(event.target.value)
          }}
        >
          {entries.map(entry => (
            <option key={entry.file} value={entry.file}>
              {entry.file.replace(/\.json$/, '')}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="mt-4" role="alert">
          {error}
        </p>
      )}
      {!record && !error && (
        <p className="mt-4" role="status">
          Loading saved measurements…
        </p>
      )}
      {record && (
        <section className="mt-6 space-y-5">
          <a
            download
            className="text-sm underline"
            href={sitePath(`/saved-benchmarks/playgrounds/${encodeURIComponent(selected)}`)}
          >
            Download complete run JSON
          </a>
          <pre className="overflow-auto rounded border border-tp-border p-4 text-xs">
            {typeof record.config === 'string'
              ? record.config
              : JSON.stringify(record.config, null, 2)}
          </pre>
          {rows.length > 0 && (
            <div className="overflow-auto">
              <table className="w-full text-left text-xs">
                <caption className="mb-3 text-left">
                  Recorded result fields; timing fields ending in Ms are milliseconds and byte
                  fields are bytes.
                </caption>
                <thead>
                  <tr>
                    {columns.map(key => (
                      <th key={key} className="border-b border-tp-border p-2">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {columns.map(key => (
                        <td key={key} className="whitespace-nowrap border-b border-tp-border p-2">
                          {typeof row[key] === 'number'
                            ? Number(row[key])
                                .toFixed(3)
                                .replace(/\.?0+$/, '')
                            : String(row[key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <details>
            <summary className="cursor-pointer text-sm underline">Complete recorded result</summary>
            <pre className="mt-3 max-h-[40rem] overflow-auto text-xs">
              {JSON.stringify(record, null, 2)}
            </pre>
          </details>
        </section>
      )}
    </main>
  )
}
