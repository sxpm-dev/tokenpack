'use client'

import { Checkbox, ToggleButton, ToggleButtonGroup } from '@heroui/react'

import { NETWORK_CONDITIONS, type ThrottleName } from '@/lib/throttle'

interface ScenarioControlsProps {
  /** Active size in KB if the scenario has a sizes dimension, else null. */
  size: number | null
  sizes: readonly number[] | undefined
  onSizeChange: (size: number) => void

  iterations: number
  onIterationsChange: (n: number) => void

  throttle: ThrottleName
  onThrottleChange: (t: ThrottleName) => void

  runSkipped: boolean
  onRunSkippedChange: (v: boolean) => void

  disabled: boolean
}

/**
 * Native `<input type="number">` and `<select>` are used for the iterations
 * and throttle pickers because HeroUI's `NumberField` and `Select` are
 * composite (multi-component) primitives that don't fit a one-line control —
 * the layout of this row would balloon. The structurally-distinct controls
 * (size + skipped toggle) use the proper HeroUI primitives.
 */
export function ScenarioControls({
  size,
  sizes,
  onSizeChange,
  iterations,
  onIterationsChange,
  throttle,
  onThrottleChange,
  runSkipped,
  onRunSkippedChange,
  disabled,
}: ScenarioControlsProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 text-xs">
      {sizes && sizes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-tp-muted">Payload size</span>
          <ToggleButtonGroup
            disallowEmptySelection
            isDisabled={disabled}
            selectedKeys={size !== null ? new Set([String(size)]) : new Set()}
            selectionMode="single"
            size="sm"
            onSelectionChange={keys => {
              const [k] = [...(keys as Set<string>)]

              if (k) onSizeChange(Number(k))
            }}
          >
            {sizes.map(s => (
              <ToggleButton key={s} id={String(s)}>
                {s} KB
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-tp-muted">Iterations</span>
        <input
          className="bg-white/5 border border-tp-border rounded px-2 py-1 text-xs w-20 text-white"
          disabled={disabled}
          max={50}
          min={1}
          type="number"
          value={iterations}
          onChange={e => onIterationsChange(Math.max(1, Math.min(50, Number(e.target.value))))}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-tp-muted">Network</span>
        <select
          className="bg-white/5 border border-tp-border rounded px-2 py-1 text-xs text-white"
          disabled={disabled}
          value={throttle}
          onChange={e => onThrottleChange(e.target.value as ThrottleName)}
        >
          {NETWORK_CONDITIONS.map(c => (
            <option key={c.name} value={c.name}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <Checkbox isDisabled={disabled} isSelected={runSkipped} onChange={onRunSkippedChange}>
        Run skipped cases
      </Checkbox>
    </div>
  )
}
