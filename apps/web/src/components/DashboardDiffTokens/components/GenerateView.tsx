'use client'

import { Button, Chip } from '@heroui/react'
import { CloudIcon, LightningIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { EntryList } from '@/components/BuildToken/components/EntryList'
import { useBuilderEntries } from '@/components/BuildToken/hooks/useBuilderEntries'
import { checkFEEligibility } from '@/components/BuildToken/utils/fe-eligibility'
import { DEFAULT_ENCODE_CONFIG, type EncodeConfig, EncodeForm } from '@/components/EncodeForm'
import { Section } from '@/components/EncodeForm/components/Section'

import { useGenerateDiff } from '../hooks/useGenerateDiff'
import { DiffResult } from './DiffResult'

export function GenerateView() {
  const baseEntries = useBuilderEntries()
  const nextEntries = useBuilderEntries()
  const [config, setConfig] = useState<EncodeConfig>(DEFAULT_ENCODE_CONFIG)
  const { output, loading, error, run } = useGenerateDiff()

  const eligibility = checkFEEligibility(config)
  const canGenerate = baseEntries.entries.length > 0 && nextEntries.entries.length > 0 && !loading

  async function handleGenerate() {
    await run(baseEntries.entries, nextEntries.entries, config)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Section description="The previous version's files." title="Base">
          <EntryList api={baseEntries} />
        </Section>

        <Section description="The new version's files." title="Next">
          <EntryList api={nextEntries} />
        </Section>
      </div>

      <EncodeForm value={config} onChange={setConfig} />

      <div className="flex items-center gap-3 flex-wrap">
        <Button isDisabled={!canGenerate} isPending={loading} size="sm" onPress={handleGenerate}>
          <LightningIcon className="mr-1" size={14} />
          {loading ? (eligibility.ok ? 'Generating…' : 'Generating (server)…') : 'Generate diff'}
        </Button>

        {!eligibility.ok && (
          <Chip color="warning" size="sm" variant="soft">
            <CloudIcon size={12} />
            <span className="ml-1">{eligibility.reason}</span>
          </Chip>
        )}

        <span className="text-[11px] text-tp-muted">
          The diff token itself is always encoded with deflate (FE-only step).
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-[12px] text-red-400 font-mono whitespace-pre-wrap">
          {error}
        </div>
      )}

      {output && (
        <DiffResult
          baseObjectURL={output.baseObjectURL}
          basePack={output.basePack}
          baseSize={output.baseBytes.byteLength}
          diffObjectURL={output.diffObjectURL}
          diffPack={output.diffPack}
          diffSize={output.diffBytes.byteLength}
          nextObjectURL={output.nextObjectURL}
          nextSize={output.nextBytes.byteLength}
        />
      )}
    </div>
  )
}
