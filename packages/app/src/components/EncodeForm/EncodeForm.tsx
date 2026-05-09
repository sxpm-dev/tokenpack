'use client'

import { Chip, Input, Tabs } from '@heroui/react'
import { LockIcon, SlidersIcon, StarIcon } from '@phosphor-icons/react'

import { AlgorithmSection } from './components/AlgorithmSection'
import { DefaultPresets } from './components/DefaultPresets'
import { OptionsRenderer } from './components/OptionsRenderer'
import type { ConfigMode, EncodeConfig } from './types'

interface EncodeFormProps {
  value: EncodeConfig
  onChange: (next: EncodeConfig) => void
}

export function EncodeForm({ value, onChange }: EncodeFormProps) {
  function patch<K extends keyof EncodeConfig>(key: K, v: EncodeConfig[K]) {
    onChange({ ...value, [key]: v })
  }

  function patchAlgo(nextAlgo: string) {
    // Reset algoOptions when switching algorithms — schemas differ per algo.
    onChange({ ...value, algo: nextAlgo, algoOptions: {} })
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        selectedKey={value.configMode}
        onSelectionChange={k => patch('configMode', k as ConfigMode)}
      >
        <Tabs.List className="w-fit">
          <Tabs.Tab id="default">
            <StarIcon className="text-accent mr-2" size={18} />
            Default
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="manual">
            <SlidersIcon className="text-accent mr-2" size={18} />
            Manual
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel className="p-0" id="default">
          <DefaultPresets value={value.defaultPreset} onChange={v => patch('defaultPreset', v)} />
        </Tabs.Panel>

        <Tabs.Panel className="p-0" id="manual">
          <div className="grid gap-3 lg:grid-cols-2">
            <AlgorithmSection algo={value.algo} onAlgoChange={patchAlgo} />
            <OptionsRenderer
              algo={value.algo}
              options={value.algoOptions}
              onChange={v => patch('algoOptions', v)}
            />
          </div>
        </Tabs.Panel>
      </Tabs>

      <div className="flex flex-col gap-1.5">
        <Input
          fullWidth
          className="!rounded-2xl"
          placeholder="Encryption key (optional)"
          type="password"
          value={value.key}
          variant="secondary"
          onChange={e => patch('key', e.target.value)}
        />
        {value.key && (
          <Chip color="warning" size="sm" variant="soft">
            <LockIcon size={12} /> AES-256
          </Chip>
        )}
      </div>
    </div>
  )
}
