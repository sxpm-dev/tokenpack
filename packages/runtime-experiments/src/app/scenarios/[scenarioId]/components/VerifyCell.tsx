'use client'

import { Tooltip } from '@heroui/react'

import { type DecodeFingerprint, formatBytes } from '@/lib/runner'

interface VerifyCellProps {
  fingerprint: DecodeFingerprint | null
  /** Canonical fingerprint hash for the active size group; null until first variant lands. */
  canonicalHash: string | null
}

/**
 * Verify column cell: shows the decoded payload's short hash + size, with a
 * tooltip listing the head bytes + match status. Hash is colored red if it
 * disagrees with the canonical hash for this size group — that's a real
 * decoder bug worth investigating.
 */
export function VerifyCell({ fingerprint, canonicalHash }: VerifyCellProps) {
  if (!fingerprint) {
    return <span className="text-white/30 text-[10px]">—</span>
  }

  const matches = canonicalHash === null || canonicalHash === fingerprint.hash
  const tooltip = [
    `hash: ${fingerprint.hash}`,
    `bytes: ${fingerprint.bytes.toLocaleString()}`,
    `head: ${fingerprint.head}`,
    canonicalHash === null
      ? '(awaiting canonical)'
      : matches
        ? 'matches canonical'
        : `MISMATCH — canonical was ${canonicalHash}`,
  ].join('\n')

  return (
    <Tooltip>
      <Tooltip.Trigger>
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span
            className={`font-mono text-[10px] tabular-nums ${matches ? 'text-white/55' : 'text-red-300'}`}
          >
            {fingerprint.hash}
          </span>
          <span className="text-[10px] text-white/35 tabular-nums">
            {formatBytes(fingerprint.bytes)}
          </span>
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <pre className="whitespace-pre text-[10px]">{tooltip}</pre>
      </Tooltip.Content>
    </Tooltip>
  )
}
