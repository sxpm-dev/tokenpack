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
      title="Compressor"
      description="Byte compression before the codec writes pixels."
      className="lg:col-span-2"
    >
      <ToggleButtonGroup
        selectionMode="single"
        selectedKeys={new Set([value])}
        onSelectionChange={keys => {
          const k = pickFirst(keys)
          if (k) onChange(k)
        }}
        disallowEmptySelection
        size="sm"
        className="flex-wrap"
      >
        {COMPRESSION_MODE_INFOS.map((m, i) => (
          <ToggleButton key={m.id} id={m.id} size="sm">
            {i > 0 && <ToggleButtonGroup.Separator />}
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
