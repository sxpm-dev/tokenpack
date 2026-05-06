'use client'

import { Checkbox, Label, NumberField, ToggleButton, ToggleButtonGroup } from '@heroui/react'

import { DRAWERS } from '../constants'
import type { DrawerChoice, GradientDirection } from '../types'
import { pickFirst } from '../utils'
import { GradientPicker } from './GradientPicker'
import { Section } from './Section'

interface DrawerSectionProps {
  drawer: DrawerChoice
  onDrawerChange: (drawer: DrawerChoice) => void
  cellSize: string
  onCellSizeChange: (value: string) => void
  useBackground: boolean
  onUseBackgroundChange: (value: boolean) => void
  gradientFrom: string
  onGradientFromChange: (color: string) => void
  gradientTo: string
  onGradientToChange: (color: string) => void
  gradientDirection: GradientDirection
  onGradientDirectionChange: (direction: GradientDirection) => void
  backgroundOpacity: number
  onBackgroundOpacityChange: (opacity: number) => void
}

export function DrawerSection({
  drawer,
  onDrawerChange,
  cellSize,
  onCellSizeChange,
  useBackground,
  onUseBackgroundChange,
  gradientFrom,
  onGradientFromChange,
  gradientTo,
  onGradientToChange,
  gradientDirection,
  onGradientDirectionChange,
  backgroundOpacity,
  onBackgroundOpacityChange,
}: DrawerSectionProps) {
  const supportsBackground = drawer === 'dot'

  return (
    <Section
      description="Pixel placement and visual background. Dot drawer supports gradient surfaces."
      title="Drawer"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-white/40">Mode</span>
        <ToggleButtonGroup
          disallowEmptySelection
          selectedKeys={new Set([drawer])}
          selectionMode="single"
          size="sm"
          onSelectionChange={keys => {
            const k = pickFirst(keys)

            if (k) onDrawerChange(k as DrawerChoice)
          }}
        >
          {DRAWERS.map(v => (
            <ToggleButton key={v} id={v}>
              {v}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {drawer === 'dot' && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-white/40">Cell size</div>
          <NumberField
            maxValue={10}
            minValue={2}
            value={Number(cellSize)}
            variant="secondary"
            onChange={v => onCellSizeChange(String(v))}
          >
            <NumberField.Group>
              <NumberField.DecrementButton>-</NumberField.DecrementButton>
              <NumberField.Input />
              <NumberField.IncrementButton>+</NumberField.IncrementButton>
            </NumberField.Group>
          </NumberField>
        </div>
      )}

      {supportsBackground && (
        <>
          <Checkbox isSelected={useBackground} variant="secondary" onChange={onUseBackgroundChange}>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label>Gradient background</Label>
            </Checkbox.Content>
          </Checkbox>

          {useBackground && (
            <GradientPicker
              direction={gradientDirection}
              from={gradientFrom}
              opacity={backgroundOpacity}
              to={gradientTo}
              onDirectionChange={onGradientDirectionChange}
              onFromChange={onGradientFromChange}
              onOpacityChange={onBackgroundOpacityChange}
              onToChange={onGradientToChange}
            />
          )}
        </>
      )}
    </Section>
  )
}
