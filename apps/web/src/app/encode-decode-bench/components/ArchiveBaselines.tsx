import { Table } from '@heroui/react'

import type { ArchiveTimeEntry } from '@/lib/bench-types'

import { fmtArchiveBytes, fmtArchiveMs } from '../utils'

interface ArchiveBaselinesProps {
  entries: ArchiveTimeEntry[]
  selectedFormat: string | null
  onSelectFormat: (format: string) => void
}

export function ArchiveBaselines({
  entries,
  selectedFormat,
  onSelectFormat,
}: ArchiveBaselinesProps) {
  if (!entries.length) return null

  return (
    <div className="space-y-2.5">
      <div className="text-[10px] text-tp-muted uppercase tracking-widest">
        Traditional archive baselines
      </div>
      <Table className="overflow-x-auto">
        <Table.Content
          aria-label="Traditional archive baselines"
          className="text-xs font-mono"
          selectedKeys={selectedFormat ? new Set([selectedFormat]) : new Set()}
          selectionMode="single"
          onSelectionChange={keys => {
            if (keys === 'all') return
            const [format] = [...keys]

            if (format) onSelectFormat(String(format))
          }}
        >
          <Table.Header>
            <Table.Column key="format" isRowHeader id="format">
              Format
            </Table.Column>
            <Table.Column key="encode" id="encode">
              Encode
            </Table.Column>
            <Table.Column key="decode" id="decode">
              Decode
            </Table.Column>
            <Table.Column key="size" id="size">
              Size
            </Table.Column>
            <Table.Column key="ratio" id="ratio">
              Ratio
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {entries.map(b => {
              const selected = b.format === selectedFormat

              return (
                <Table.Row
                  key={b.format}
                  className={`cursor-pointer ${
                    selected ? 'bg-green-400/[0.08] text-green-300' : 'text-tp-muted'
                  }`}
                  id={b.format}
                >
                  <Table.Cell className="font-semibold">
                    <span className="inline-flex items-center gap-2">
                      {b.format}
                      {selected && (
                        <span className="rounded border border-green-400/30 px-1 text-[9px] uppercase tracking-widest text-green-400/70">
                          selected
                        </span>
                      )}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{fmtArchiveMs(b.encodeMs)}</Table.Cell>
                  <Table.Cell>{fmtArchiveMs(b.decodeMs)}</Table.Cell>
                  <Table.Cell>{fmtArchiveBytes(b.bytes)}</Table.Cell>
                  <Table.Cell>{Math.round((b.bytes / b.originalBytes) * 100)}%</Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Content>
      </Table>
    </div>
  )
}
