'use client'

import { Chip } from '@heroui/react'
import { ALGORITHM_INFOS } from 'tokenpack/algorithms/catalog-info'
import { ALGOS, PRESETS } from '../constants'
import { Section } from './Section'
import { SelectField } from './SelectField'

interface AlgorithmSectionProps {
  preset: string
  onPresetChange: (preset: string) => void
  algo: string
  onAlgoChange: (algo: string) => void
}

export function AlgorithmSection({ preset, onPresetChange, algo, onAlgoChange }: AlgorithmSectionProps) {
  const selectedAlgorithm = ALGORITHM_INFOS.find(entry => entry.name === algo)
  const presetIsNone = preset === 'none'

  return (
    <Section
      title="Algorithm"
      description="The public entry point. Presets are preconfigured algorithms; none exposes the parts."
      className="lg:col-span-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField
          label="Preset algorithm"
          value={preset}
          values={PRESETS}
          onChange={onPresetChange}
        />
        {presetIsNone && (
          <SelectField
            label="Codec algorithm"
            value={algo}
            values={ALGOS}
            onChange={onAlgoChange}
          />
        )}
      </div>

      {presetIsNone && selectedAlgorithm && (
        <div className="flex flex-wrap gap-1.5">
          <Chip size="sm" variant="tertiary">
            {selectedAlgorithm.streamFriendly === 'no' ? 'not streamable' : 'streamable'}
          </Chip>
          <Chip size="sm" variant="tertiary">
            {selectedAlgorithm.feFriendly === 'no' ? 'node only' : 'browser friendly'}
          </Chip>
        </div>
      )}
    </Section>
  )
}
