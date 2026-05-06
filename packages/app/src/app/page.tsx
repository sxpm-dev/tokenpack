'use client'

import { Tabs } from '@heroui/react'
import { GitDiffIcon, PlusIcon, ScanSmileyIcon } from '@phosphor-icons/react'

import { CreateToken } from '@/components/CreateToken'
import { DecodeToken } from '@/components/DecodeToken'
import { DiffTokens } from '@/components/DiffTokens'

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-5">
      <Tabs className="w-full" defaultSelectedKey="create">
        <Tabs.ListContainer>
          <Tabs.List
            aria-label="TokenPack actions"
            className="mx-auto w-full max-w-2xl overflow-x-auto"
          >
            <Tabs.Tab id="create">
              <PlusIcon className="text-accent mr-2" size={18} /> Create Token
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="decode">
              <ScanSmileyIcon className="text-accent mr-2" size={18} /> Decode Token
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="diff">
              <GitDiffIcon className="text-accent mr-2" size={18} /> Diff
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="create">
          <CreateToken />
        </Tabs.Panel>

        <Tabs.Panel id="decode">
          <DecodeToken />
        </Tabs.Panel>

        <Tabs.Panel id="diff">
          <DiffTokens />
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
