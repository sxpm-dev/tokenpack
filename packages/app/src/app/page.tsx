'use client'

import { Tabs } from '@heroui/react'
import { GitDiffIcon, MagnifyingGlassIcon, PackageIcon } from '@phosphor-icons/react'
import type { DecodeSource } from '@tokenpack/browser'
import { useCallback, useState } from 'react'

import { type BuildResult, BuildToken } from '@/components/BuildToken'
import { DiffTokens } from '@/components/DiffTokens'
import { formatBytes } from '@/components/EncodeForm'
import { Explorer } from '@/components/Explorer'

type TabKey = 'build' | 'explore' | 'diff'

export default function Home() {
  const [tab, setTab] = useState<TabKey>('build')
  const [source, setSource] = useState<DecodeSource | null>(null)
  const [sourceLabel, setSourceLabel] = useState('')

  const handleOpenInExplorer = useCallback((result: BuildResult) => {
    setSource(result.bytes)
    setSourceLabel(`built · ${formatBytes(result.bytes.byteLength)}`)
    setTab('explore')
  }, [])

  const handleSelectFile = useCallback((file: File) => {
    setSource(file)
    setSourceLabel(`${file.name} · ${formatBytes(file.size)}`)
  }, [])

  const handleSelectURL = useCallback((url: string) => {
    setSource(url)
    setSourceLabel(url)
  }, [])

  // Reset Explorer state when leaving the Explorer tab so re-entering shows a
  // fresh page rather than the previously-loaded token.
  const handleTabChange = useCallback(
    (next: TabKey) => {
      if (tab === 'explore' && next !== 'explore') {
        setSource(null)
        setSourceLabel('')
      }
      setTab(next)
    },
    [tab],
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-5">
      <Tabs
        className="w-full"
        selectedKey={tab}
        onSelectionChange={k => handleTabChange(k as TabKey)}
      >
        <Tabs.ListContainer>
          <Tabs.List
            aria-label="TokenPack actions"
            className="mx-auto w-full max-w-2xl overflow-x-auto"
          >
            <Tabs.Tab id="build">
              <PackageIcon className="text-accent mr-2" size={18} />
              Build Token
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="explore">
              <MagnifyingGlassIcon className="text-accent mr-2" size={18} />
              Explorer
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="diff">
              <GitDiffIcon className="text-accent mr-2" size={18} />
              Diff
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="build">
          <BuildToken onOpenInExplorer={handleOpenInExplorer} />
        </Tabs.Panel>

        <Tabs.Panel id="explore">
          <Explorer
            source={source}
            sourceLabel={sourceLabel}
            onSelectFile={handleSelectFile}
            onSelectURL={handleSelectURL}
          />
        </Tabs.Panel>

        <Tabs.Panel id="diff">
          <DiffTokens />
        </Tabs.Panel>
      </Tabs>
    </main>
  )
}
