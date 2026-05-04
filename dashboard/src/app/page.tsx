'use client'

import { Tabs } from '@heroui/react'
import { CreateToken } from '@/components/CreateToken'
import { DecodeToken } from '@/components/DecodeToken'
import { DiffTokens } from '@/components/DiffTokens'

export default function Home() {
  return (
    <main className="px-6 py-8 max-w-7xl mx-auto">
      <Tabs defaultSelectedKey="create" className="w-full">
        <Tabs.ListContainer>
          <Tabs.List aria-label="TokenPack actions">
            <Tabs.Tab id="create">
              Create Token
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="decode">
              Decode Token
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="diff">
              Diff
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="create" className="pt-6">
          <CreateToken />
        </Tabs.Panel>

        <Tabs.Panel id="decode" className="pt-6">
          <DecodeToken />
        </Tabs.Panel>

        <Tabs.Panel id="diff" className="pt-6">
          <DiffTokens />
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
