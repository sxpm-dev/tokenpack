'use client'

import { Chip, ToggleButton, ToggleButtonGroup } from '@heroui/react'
import { DEFAULT_PRESETS } from 'tokenpack/algorithms/catalog-info'

import type { DefaultPresetName } from '../types'
import { pickFirst } from '../utils'
import { Section } from './Section'

interface DefaultPresetsProps {
  value: DefaultPresetName
  onChange: (value: DefaultPresetName) => void
}

export function DefaultPresets({ value, onChange }: DefaultPresetsProps) {
  return (
    <Section
      className="lg:col-span-2"
      description="The default most optimized presets"
      title="Algorithm"
    >
      <ToggleButtonGroup
        disallowEmptySelection
        className="flex-wrap"
        selectedKeys={new Set([value])}
        selectionMode="single"
        size="sm"
        onSelectionChange={keys => {
          const k = pickFirst(keys)

          if (k) onChange(k as DefaultPresetName)
        }}
      >
        {DEFAULT_PRESETS.map(p => (
          <ToggleButton key={p.name} className="h-18 text-left" id={p.name}>
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                {p.label}
                <div>
                  {p.streamable && (
                    <span className="text-[9px] text-green-400/60 border border-green-400/30 rounded-xl px-1">
                      stream
                    </span>
                  )}
                </div>
              </div>
              <div>
                <Chip color="warning" size="sm" variant="soft">
                  {p.description}
                </Chip>
              </div>
            </div>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Section>
  )
}
