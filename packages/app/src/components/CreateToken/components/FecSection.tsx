'use client'

import { ToggleButton, ToggleButtonGroup } from '@heroui/react'
import { useState } from 'react'
import { FEC_MODE_INFOS } from 'tokenpack/algorithms/catalog-info'

import { pickFirst } from '../utils'
import { Section } from './Section'

interface FecSectionProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function FecSection({ value, onChange, disabled = false }: FecSectionProps) {
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  return (
    <Section
      title="Error correction"
      description={
        disabled
          ? 'FEC is disabled while streaming is on (the streaming decoder cannot consume FEC tokens incrementally).'
          : 'Adds Reed-Solomon parity bytes after compression and encryption. Pure overhead for clean digital round-trips — useful when the token will be screenshotted, photographed, printed, or stored on lossy media.'
      }
      className="lg:col-span-2"
    >
      <ToggleButtonGroup
        selectionMode="single"
        selectedKeys={new Set([disabled ? 'none' : value])}
        onSelectionChange={keys => {
          if (disabled) return
          const k = pickFirst(keys)
          if (k) onChange(k)
        }}
        disallowEmptySelection
        size="sm"
        className="flex-wrap"
      >
        {FEC_MODE_INFOS.map((m, i) => (
          <ToggleButton key={m.id} id={m.id} size="sm" isDisabled={disabled && m.id !== 'none'}>
            {i > 0 && <ToggleButtonGroup.Separator />}
            <span className="flex flex-col items-start leading-tight">
              <span>{m.label}</span>
              {m.id !== 'none' && (
                <span className="text-[9px] text-white/40">
                  +{m.overheadPct}% · recovers {m.recoverableBytesPerBlock}/255B per block
                </span>
              )}
            </span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <button
        type="button"
        onClick={() => setShowHowItWorks(o => !o)}
        className="text-left text-[10px] text-white/35 hover:text-white/60 transition uppercase tracking-wider"
      >
        {showHowItWorks ? '▾' : '▸'} How it works
      </button>

      {showHowItWorks && (
        <div className="text-[11px] leading-5 text-white/55 border-l-2 border-white/10 pl-3 space-y-2">
          <p>
            Reed-Solomon splits the encoded payload into <span className="font-mono">255-byte</span>{' '}
            blocks and appends parity bytes to each. If up to{' '}
            <span className="font-mono">⌊parity / 2⌋</span> bytes per block become corrupted, decode
            recovers the original.
          </p>
          <p>
            One bad pixel typically corrupts 3–4 bytes (depending on bpp), so{' '}
            <span className="font-mono">rs-5</span> survives roughly <strong>2 bad pixels</strong>{' '}
            per block, <span className="font-mono">rs-15</span> survives ~6, and{' '}
            <span className="font-mono">rs-25</span> survives ~10. Higher levels = more resilience
            but bigger tokens.
          </p>
          <p>
            FEC is the <em>outermost</em> layer of the pipeline: it wraps everything (compression +
            encryption), so the parity protects the ciphertext too.
          </p>
        </div>
      )}
    </Section>
  )
}
