'use client'

import { Chip, ListBox, Select } from '@heroui/react'

import type { AlgoMeta } from '@/lib/algo-meta'
import { usePlaygroundAlgorithms } from '@/lib/use-playground-algorithms'

import { Section } from './Section'

interface AlgorithmSectionProps {
  algo: string
  onAlgoChange: (algo: string) => void
}

export function AlgorithmSection({ algo, onAlgoChange }: AlgorithmSectionProps) {
  const bindings = usePlaygroundAlgorithms()
  const selected = bindings.find(b => b.name === algo)

  return (
    <Section
      className="lg:col-span-2"
      description="The bound recipe — codec / surface / compressor / drawer. Pick by full configuration."
      title="Algorithm"
    >
      <Select
        selectedKey={algo}
        variant="secondary"
        onSelectionChange={key => {
          if (key !== null) onAlgoChange(String(key))
        }}
      >
        <Select.Trigger>
          <Select.Value>
            {selected ? (
              <span className="flex w-full items-center gap-2">
                <span className="font-mono text-[12px]">{selected.name}</span>
                <span className="text-[10px] text-white/40">{describeBinding(selected)}</span>
              </span>
            ) : (
              <span className="text-white/40">Select an algorithm</span>
            )}
          </Select.Value>
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox aria-label="Algorithm">
            {bindings.map(b => (
              <ListBox.Item key={b.name} id={b.name} textValue={b.name}>
                <span className="flex w-full flex-col items-start gap-0.5 leading-tight">
                  <span className="text-[12px] font-mono">{b.name}</span>
                  <span className="text-[10px] text-white/45 font-mono tabular-nums">
                    {describeBinding(b)}
                  </span>
                  <span className="flex gap-1 pt-1">
                    {b.implementedIn.map(pkg => (
                      <Chip
                        key={pkg}
                        className="h-4 px-1 text-[9px] uppercase"
                        size="sm"
                        variant="tertiary"
                      >
                        {pkg}
                      </Chip>
                    ))}
                    {b.mirrored && (
                      <Chip className="h-4 px-1 text-[9px] uppercase" size="sm" variant="tertiary">
                        mirrored
                      </Chip>
                    )}
                    {b.binding.streamable && (
                      <Chip className="h-4 px-1 text-[9px]" size="sm" variant="tertiary">
                        stream
                      </Chip>
                    )}
                  </span>
                </span>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      {selected && (
        <div className="flex flex-wrap gap-1.5">
          <Chip
            color={selected.binding.streamable ? 'success' : 'default'}
            size="sm"
            title={
              selected.binding.streamable
                ? 'Decode can pipeline with download (overlapped network + decode).'
                : 'Decoder waits for the full token before producing output.'
            }
            variant="soft"
          >
            {selected.binding.streamable ? 'streamable' : 'not streamable'}
          </Chip>
          {selected.implementedIn.map(pkg => (
            <Chip key={pkg} size="sm" variant="soft">
              {pkg}
            </Chip>
          ))}
          {selected.mirrored && (
            <Chip color="success" size="sm" variant="soft">
              mirrored
            </Chip>
          )}
          <BindingChip
            label="codec"
            title={selected.binding.codecDescription}
            value={selected.binding.codec}
          />
          <BindingChip
            label="surface"
            title={selected.binding.surfaceDescription}
            value={selected.binding.surface}
          />
          <BindingChip
            label="compressor"
            title={selected.binding.compressorDescription}
            value={selected.binding.compressor}
          />
          <BindingChip
            label="drawer"
            title={selected.binding.drawerDescription}
            value={selected.binding.drawer}
          />
        </div>
      )}
    </Section>
  )
}

function BindingChip({ label, title, value }: { label: string; title: string; value: string }) {
  return (
    <Chip size="sm" title={title} variant="tertiary">
      {label}: {value}
    </Chip>
  )
}

function describeBinding(b: AlgoMeta): string {
  return `${b.binding.codec} · ${b.binding.surface} · ${b.binding.compressor} · ${b.binding.drawer}`
}
