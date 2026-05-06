'use client'

import { ColorArea, ColorPicker, ColorSlider, ColorSwatch, Label, Slider } from '@heroui/react'

import { GRADIENT_DIRECTIONS } from '../constants'
import type { GradientDirection } from '../types'
import { SelectField } from './SelectField'

interface GradientPickerProps {
  from: string
  onFromChange: (color: string) => void
  to: string
  onToChange: (color: string) => void
  direction: GradientDirection
  onDirectionChange: (direction: GradientDirection) => void
  opacity: number
  onOpacityChange: (opacity: number) => void
}

export function GradientPicker({
  from,
  onFromChange,
  to,
  onToChange,
  direction,
  onDirectionChange,
  opacity,
  onOpacityChange,
}: GradientPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <ColorPicker value={from} onChange={c => onFromChange(c.toString('hex'))}>
          <ColorPicker.Trigger>
            <ColorSwatch size="xs" />
            <Label>From</Label>
          </ColorPicker.Trigger>
          <ColorPicker.Popover>
            <ColorArea
              aria-label="Gradient from color"
              className="max-w-full"
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
            >
              <ColorArea.Thumb />
            </ColorArea>
            <ColorSlider channel="hue" className="gap-1 px-1" colorSpace="hsb">
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
          </ColorPicker.Popover>
        </ColorPicker>

        <ColorPicker value={to} onChange={c => onToChange(c.toString('hex'))}>
          <ColorPicker.Trigger>
            <ColorSwatch size="xs" />
            <Label>To</Label>
          </ColorPicker.Trigger>
          <ColorPicker.Popover>
            <ColorArea
              aria-label="Gradient to color"
              className="max-w-full"
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
            >
              <ColorArea.Thumb />
            </ColorArea>
            <ColorSlider channel="hue" className="gap-1 px-1" colorSpace="hsb">
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
            </ColorSlider>
          </ColorPicker.Popover>
        </ColorPicker>

        <div
          className="h-8 min-w-[120px] flex-1 rounded-2xl"
          style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <SelectField
          label="Direction"
          value={direction}
          values={GRADIENT_DIRECTIONS}
          onChange={v => onDirectionChange(v as GradientDirection)}
        />
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-white/40">Data opacity · {opacity}%</span>
          <Slider
            maxValue={100}
            minValue={20}
            step={5}
            value={opacity}
            onChange={v => onOpacityChange(Array.isArray(v) ? v[0] : v)}
          >
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
        </div>
      </div>
    </div>
  )
}
