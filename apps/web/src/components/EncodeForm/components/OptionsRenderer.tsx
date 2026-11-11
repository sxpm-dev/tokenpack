'use client'

// Renders the selected algorithm's `optionsSchema` as a list of sub-controls.
// One control per schema key (e.g. `compressor.level`, `surface.channels`,
// `decoration.kind`/`decoration.size`). Replaces the old Compressor/Drawer/
// Surface/Fec sections — every algorithm now declares the only options that
// actually affect it.

import { ColorArea, ColorField, ColorPicker, ColorSlider, ColorSwatch, Slider } from '@heroui/react'
import type { Color } from 'react-aria-components'
import { parseColor } from 'react-aria-components'
import type { OptionDef, OptionsSchema } from 'tokenpack/components/options'

import { usePlaygroundAlgorithms } from '@/lib/use-playground-algorithms'

import { Section } from './Section'
import { SelectField } from './SelectField'

interface OptionsRendererProps {
  algo: string
  options: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

export function OptionsRenderer({ algo, options, onChange }: OptionsRendererProps) {
  const catalog = usePlaygroundAlgorithms()
  const schema: OptionsSchema = catalog.find(entry => entry.name === algo)?.optionsSchema ?? {}

  const visibleKeys = Object.keys(schema).filter(key => isVisible(schema[key], schema, options))

  if (visibleKeys.length === 0) {
    return (
      <Section
        className="lg:col-span-2"
        description="No tunable options for this algorithm."
        title="Options"
      >
        <div className="text-xs text-tp-muted">Algorithm has no exposed options.</div>
      </Section>
    )
  }

  return (
    <Section
      className="lg:col-span-2"
      description="Tunable options for the selected algorithm. Components are bound at the algorithm level."
      title="Options"
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {visibleKeys.map(key => (
          <OptionControl
            key={key}
            def={schema[key]}
            optKey={key}
            value={options[key]}
            onChange={v => onChange({ ...options, [key]: v })}
          />
        ))}
      </div>
    </Section>
  )
}

function isVisible(
  def: OptionDef,
  schema: OptionsSchema,
  options: Record<string, unknown>,
): boolean {
  if (!def.dependsOn) return true
  const depKey = def.dependsOn.key
  const depSchema = schema[depKey]
  const current = options[depKey] ?? depSchema?.default

  return current === def.dependsOn.value
}

interface OptionControlProps {
  optKey: string
  def: OptionDef
  value: unknown
  onChange: (next: unknown) => void
}

function OptionControl({ optKey, def, value, onChange }: OptionControlProps) {
  const label = def.label ?? optKey

  if (def.type === 'enum' && def.values) {
    const stringValues = def.values.map(v => String(v))
    const current = value !== undefined ? String(value) : String(def.default)

    return (
      <SelectField
        label={label}
        value={current}
        values={stringValues}
        onChange={raw => onChange(coerce(raw, def.values))}
      />
    )
  }

  if (def.type === 'number' && def.range) {
    const [min, max] = def.range
    const step = def.step ?? 1
    const current = typeof value === 'number' ? value : (def.default as number)

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-tp-muted">
          <span title={def.description}>{label}</span>
          <span className="font-mono text-tp-muted">{current}</span>
        </div>
        <Slider
          aria-label={label}
          maxValue={max}
          minValue={min}
          step={step}
          value={current}
          onChange={v => onChange(typeof v === 'number' ? v : v[0])}
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>
    )
  }

  if (def.type === 'color') {
    const current = typeof value === 'string' ? value : (def.default as string)
    const parsed = safeParseColor(current)

    return (
      <div className="flex flex-col gap-1">
        <div className="text-xs text-tp-muted" title={def.description}>
          {label}
        </div>
        <ColorPicker value={parsed} onChange={c => onChange(colorToHex(c))}>
          <ColorPicker.Trigger
            aria-label={label}
            className="flex items-center gap-2 rounded-lg border border-tp-border bg-white/5 px-2 py-1 cursor-pointer hover:bg-white/10"
          >
            <ColorSwatch className="h-6 w-6 rounded-md border border-tp-border" />
            <span className="text-[11px] font-mono text-tp-fg">{colorToHex(parsed)}</span>
          </ColorPicker.Trigger>
          <ColorPicker.Popover>
            <div className="flex flex-col gap-3 p-3 min-w-[220px]">
              <ColorArea
                className="h-40 w-full rounded-md overflow-hidden"
                colorSpace="hsb"
                xChannel="saturation"
                yChannel="brightness"
              >
                <ColorArea.Thumb className="h-4 w-4 rounded-full border-2 border-white shadow ring-1 ring-black/30" />
              </ColorArea>
              <ColorSlider channel="hue" colorSpace="hsl">
                <ColorSlider.Track className="h-3 rounded-full overflow-hidden">
                  <ColorSlider.Thumb className="h-4 w-4 rounded-full border-2 border-white shadow" />
                </ColorSlider.Track>
              </ColorSlider>
              <ColorField aria-label={`${label} hex`} />
            </div>
          </ColorPicker.Popover>
        </ColorPicker>
      </div>
    )
  }

  return (
    <div className="text-xs text-tp-muted">
      {label}: <span className="font-mono">{String(value ?? def.default)}</span>{' '}
      <span className="text-tp-muted">(unsupported control type)</span>
    </div>
  )
}

function coerce(raw: string, values?: readonly unknown[]): unknown {
  if (!values) return raw
  // Match by string-equality with the original-typed value. Numeric enums
  // come in as `[4, 6, 11]`; the SelectField gives back the string `"11"`.
  const match = values.find(v => String(v) === raw)

  return match ?? raw
}

function safeParseColor(input: string): Color {
  try {
    return parseColor(input)
  } catch {
    return parseColor('#000000')
  }
}

function colorToHex(c: Color): string {
  return c.toString('hex').toLowerCase()
}
