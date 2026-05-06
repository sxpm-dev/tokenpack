'use client'

import { Checkbox, Label, ToggleButton, ToggleButtonGroup } from '@heroui/react'

import { BPP_VALUES, FORMATS } from '../constants'
import type { ImageFormat } from '../types'
import { pickFirst } from '../utils'
import { Section } from './Section'

interface SurfaceSectionProps {
  imgFormat: ImageFormat
  onImgFormatChange: (format: ImageFormat) => void
  effectiveBpp: number
  onBppChange: (bpp: number) => void
  streaming: boolean
  onStreamingChange: (value: boolean) => void
}

export function SurfaceSection({
  imgFormat,
  onImgFormatChange,
  effectiveBpp,
  onBppChange,
  streaming,
  onStreamingChange,
}: SurfaceSectionProps) {
  return (
    <Section description="Image container and file pixel channels." title="Surface">
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-white/40">Image format</span>
          <ToggleButtonGroup
            disallowEmptySelection
            selectedKeys={new Set([imgFormat])}
            selectionMode="single"
            size="sm"
            onSelectionChange={keys => {
              const k = pickFirst(keys)

              if (k) onImgFormatChange(k as ImageFormat)
            }}
          >
            {FORMATS.map(f => (
              <ToggleButton key={f} id={f}>
                {f.toUpperCase()}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-white/40">Bytes per pixel</span>
          <ToggleButtonGroup
            disallowEmptySelection
            selectedKeys={new Set([String(effectiveBpp)])}
            selectionMode="single"
            size="sm"
            onSelectionChange={keys => {
              const k = pickFirst(keys)

              if (k) onBppChange(Number(k))
            }}
          >
            {BPP_VALUES.map(n => (
              <ToggleButton key={n} id={String(n)}>
                {n}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </div>

      <Checkbox
        isDisabled={imgFormat !== 'png'}
        isSelected={streaming}
        variant="secondary"
        onChange={onStreamingChange}
      >
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>
          <Label>Streaming PNG surface</Label>
        </Checkbox.Content>
      </Checkbox>
    </Section>
  )
}
