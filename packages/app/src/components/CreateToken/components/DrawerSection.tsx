'use client'

import {
  Checkbox,
  Label,
  NumberField,
  ToggleButton,
  ToggleButtonGroup,
} from '@heroui/react'
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
      title="Drawer"
      description="Pixel placement and visual background. Dot drawer supports gradient surfaces."
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-white/40">Mode</span>
        <ToggleButtonGroup
          selectionMode="single"
          selectedKeys={new Set([drawer])}
          onSelectionChange={keys => {
            const k = pickFirst(keys)
            if (k) onDrawerChange(k as DrawerChoice)
          }}
          disallowEmptySelection
          size="sm"
        >
          {DRAWERS.map((v, i) => (
            <ToggleButton key={v} id={v}>
              {i > 0 && <ToggleButtonGroup.Separator />}
              {v}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {drawer === 'dot' && (
        <div className="flex flex-col gap-1">
          <div className="text-xs text-white/40">Cell size</div>
          <NumberField
            value={Number(cellSize)}
            onChange={v => onCellSizeChange(String(v))}
            minValue={2}
            maxValue={10}
            variant="secondary"
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
          <Checkbox
            isSelected={useBackground}
            onChange={onUseBackgroundChange}
            variant="secondary"
          >
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label>Gradient background</Label>
            </Checkbox.Content>
          </Checkbox>

          {useBackground && (
            <GradientPicker
              from={gradientFrom}
              onFromChange={onGradientFromChange}
              to={gradientTo}
              onToChange={onGradientToChange}
              direction={gradientDirection}
              onDirectionChange={onGradientDirectionChange}
              opacity={backgroundOpacity}
              onOpacityChange={onBackgroundOpacityChange}
            />
          )}
        </>
      )}
    </Section>
  )
}
