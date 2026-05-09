'use client'

import { Button, Chip } from '@heroui/react'
import { CloudIcon, LightningIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { DEFAULT_ENCODE_CONFIG, type EncodeConfig, EncodeForm } from '@/components/EncodeForm'
import { Section } from '@/components/EncodeForm/components/Section'

import { EntryList } from './components/EntryList'
import { TokenResult } from './components/TokenResult'
import { useBuilderEntries } from './hooks/useBuilderEntries'
import { useSmartEncode } from './hooks/useSmartEncode'
import type { BuildResult } from './types'
import { checkFEEligibility } from './utils/fe-eligibility'

interface BuildTokenProps {
  /** Called when user clicks "Open in Explorer" — parent loads bytes + switches tab. */
  onOpenInExplorer?: (result: BuildResult) => void
}

export function BuildToken({ onOpenInExplorer }: BuildTokenProps) {
  const entriesApi = useBuilderEntries()
  const encodeApi = useSmartEncode()

  const [config, setConfig] = useState<EncodeConfig>(DEFAULT_ENCODE_CONFIG)
  const eligibility = checkFEEligibility(config)

  async function handleEncode() {
    await encodeApi.run(entriesApi.entries, config)
  }

  const canEncode = entriesApi.entries.length > 0 && !encodeApi.loading

  return (
    <div className="flex flex-col gap-3">
      {entriesApi.entries.length > 0 && (
        <div className="flex justify-end">
          <button
            className="text-[11px] text-white/40 hover:text-white/70 underline"
            type="button"
            onClick={entriesApi.clear}
          >
            clear all
          </button>
        </div>
      )}

      <Section
        description="Files in the pack. Path = its location inside the pack."
        title="Pack contents"
      >
        <EntryList api={entriesApi} />
      </Section>

      <EncodeForm value={config} onChange={setConfig} />

      <div className="flex items-center gap-3 flex-wrap">
        <Button
          isDisabled={!canEncode}
          isPending={encodeApi.loading}
          size="sm"
          onPress={handleEncode}
        >
          <LightningIcon className="mr-1" size={14} />
          {encodeApi.loading ? (eligibility.ok ? 'Encoding…' : 'Encoding (server)…') : 'Encode'}
        </Button>

        {!eligibility.ok && (
          <Chip color="warning" size="sm" variant="soft">
            <CloudIcon size={12} />
            <span className="ml-1">{eligibility.reason}</span>
          </Chip>
        )}
      </div>

      {encodeApi.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 font-mono whitespace-pre-wrap">
          {encodeApi.error}
        </div>
      )}

      {encodeApi.result && (
        <>
          <TokenResult
            fileName={encodeApi.result.fileName}
            stats={{
              inputBytes: encodeApi.result.inputBytes,
              tokenBytes: encodeApi.result.bytes.byteLength,
              gzipBytes: encodeApi.result.gzipBytes,
              brotliBytes: encodeApi.result.brotliBytes,
            }}
            url={encodeApi.result.objectURL}
          />

          {onOpenInExplorer && (
            <div className="flex">
              <Button
                size="sm"
                variant="secondary"
                onPress={() => onOpenInExplorer(encodeApi.result!)}
              >
                <MagnifyingGlassIcon className="mr-1" size={14} />
                Open in Explorer
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
