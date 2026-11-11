'use client'

import { Tabs } from '@heroui/react'
import { GitBranchIcon, GitDiffIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { CompareView } from './components/CompareView'
import { GenerateView } from './components/GenerateView'

type Mode = 'compare' | 'generate'

export function DiffTokens() {
  const [mode, setMode] = useState<Mode>('compare')

  return (
    <Tabs className="w-full" selectedKey={mode} onSelectionChange={k => setMode(k as Mode)}>
      <Tabs.List className="w-fit">
        <Tabs.Tab id="compare">
          <GitDiffIcon className="text-accent mr-2" size={16} />
          Compare
          <Tabs.Indicator />
        </Tabs.Tab>
        <Tabs.Tab id="generate">
          <GitBranchIcon className="text-accent mr-2" size={16} />
          Generate
          <Tabs.Indicator />
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel className="p-0 pt-3" id="compare">
        <CompareView />
      </Tabs.Panel>

      <Tabs.Panel className="p-0 pt-3" id="generate">
        <GenerateView />
      </Tabs.Panel>
    </Tabs>
  )
}
