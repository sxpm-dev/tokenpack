'use client'

import { ToggleButton, ToggleButtonGroup } from '@heroui/react'
import { COMPRESSION_MODE_INFOS } from 'tokenpack/algorithms/catalog-info'

import { pickFirst } from '../utils'
import { Section } from './Section'

interface CompressorSectionProps {
  value: string
  onChange: (value: string) => void
}

export function CompressorSection({ value, onChange }: CompressorSectionProps) {
  return (
    <Section
      className="lg:col-span-2"
      description="Byte compression before the codec writes pixels."
      title="Compressor"
    >
      <ToggleButtonGroup
        disallowEmptySelection
        className="flex-wrap"
        selectedKeys={new Set([value])}
        selectionMode="single"
        size="sm"
        onSelectionChange={keys => {
          const k = pickFirst(keys)

          if (k) onChange(k)
        }}
      >
        {COMPRESSION_MODE_INFOS.map(m => (
          <ToggleButton key={m.id} id={m.id} size="sm">
            {m.label}
            {m.streamableDecode && (
              <span className="text-[9px] text-green-400/60 border border-green-400/30 rounded-xl px-1">
                stream
              </span>
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Section>
  )
}
