'use client'

import { CheckIcon } from '@phosphor-icons/react'

import { DEFAULT_PRESETS, type DefaultPresetDef } from '../default-presets'
import type { DefaultPresetName } from '../types'
import { Section } from './Section'

interface DefaultPresetsProps {
  value: DefaultPresetName
  onChange: (value: DefaultPresetName) => void
}

export function DefaultPresets({ value, onChange }: DefaultPresetsProps) {
  return (
    <Section
      className="lg:col-span-2"
      description="Pick a target. Browser variants stay FE-only; overall variants may use the server."
      title="Algorithm"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {DEFAULT_PRESETS.map(preset => (
          <PresetCard
            key={preset.name}
            isActive={value === preset.name}
            preset={preset}
            onSelect={() => onChange(preset.name)}
          />
        ))}
      </div>
    </Section>
  )
}

interface PresetCardProps {
  preset: DefaultPresetDef
  isActive: boolean
  onSelect: () => void
}

function PresetCard({ preset, isActive, onSelect }: PresetCardProps) {
  const isStreaming = preset.algo.includes('stream')

  return (
    <button
      aria-pressed={isActive}
      className={`group relative flex h-full w-full flex-col items-stretch gap-1.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
        isActive
          ? 'border-accent/60 bg-accent/[0.07] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
          : 'border-white/8 bg-white/[0.02] text-white/75 hover:border-white/15 hover:bg-white/[0.04] hover:text-white/95'
      }`}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <span className="text-[12.5px] font-medium tracking-tight">{preset.label}</span>
        <span
          className={`text-[9px] uppercase tracking-[0.1em] font-medium ${
            isActive ? 'text-accent/80' : 'text-white/35'
          }`}
        >
          {preset.hint}
        </span>
        {isStreaming && (
          <span className="ml-auto text-[9px] text-emerald-400/85 border border-emerald-400/30 rounded-full px-1.5 py-px font-medium tracking-tight">
            stream
          </span>
        )}
        {isActive && !isStreaming && (
          <CheckIcon className="ml-auto text-accent" size={12} weight="bold" />
        )}
      </div>
      <div
        className={`text-[10.5px] font-mono tabular-nums tracking-tight ${
          isActive ? 'text-white/55' : 'text-white/35 group-hover:text-white/45'
        }`}
      >
        {preset.algo}
        <span className="text-white/20"> · level </span>
        {preset.level}
        <span className="text-white/20"> · </span>
        {preset.channels} bpp
      </div>
      {isActive && isStreaming && (
        <CheckIcon
          aria-hidden
          className="absolute right-3 top-2.5 text-accent"
          size={12}
          weight="bold"
        />
      )}
    </button>
  )
}
