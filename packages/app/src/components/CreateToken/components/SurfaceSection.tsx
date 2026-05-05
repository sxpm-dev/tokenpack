'use client'

import {
  Checkbox,
  Label,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui/react'
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
    <Section
      title="Surface"
      description="Image container and file pixel channels."
    >
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-white/40">Image format</span>
          <ToggleButtonGroup
            selectionMode="single"
            selectedKeys={new Set([imgFormat])}
            onSelectionChange={keys => {
              const k = pickFirst(keys)
              if (k) onImgFormatChange(k as ImageFormat)
            }}
            disallowEmptySelection
            size="sm"
          >
            {FORMATS.map((f, i) => (
              <ToggleButton key={f} id={f}>
                {i > 0 && <ToggleButtonGroup.Separator />}
                {f.toUpperCase()}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-white/40">Bytes per pixel</span>
          <ToggleButtonGroup
            selectionMode="single"
            selectedKeys={new Set([String(effectiveBpp)])}
            onSelectionChange={keys => {
              const k = pickFirst(keys)
              if (k) onBppChange(Number(k))
            }}
            disallowEmptySelection
            size="sm"
          >
            {BPP_VALUES.map((n, i) => (
              <ToggleButton key={n} id={String(n)}>
                {i > 0 && <ToggleButtonGroup.Separator />}
                {n}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </div>

      <Checkbox
        isSelected={streaming}
        isDisabled={imgFormat !== 'png'}
        onChange={onStreamingChange}
        variant="secondary"
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
