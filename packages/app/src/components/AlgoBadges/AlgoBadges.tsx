'use client'

import { classifyMeta } from '@/lib/algo-catalog'
import { usePlaygroundAlgorithms } from '@/lib/use-playground-algorithms'

interface AlgoBadgesProps {
  algoName: string
  /** Hide the BATCH badge — useful in dense tables where only STREAM matters. */
  hideBatch?: boolean
  /** Hide env badges (NODE/BROWSER) — useful when env is implied by context. */
  hideEnv?: boolean
}

export function AlgoBadges({ algoName, hideBatch, hideEnv }: AlgoBadgesProps) {
  const catalog = usePlaygroundAlgorithms()
  const c = classifyMeta(catalog.find(algo => algo.name === algoName))
  const showBatch = !hideBatch
  const showStreamOrBatch = c.stream || showBatch

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {!hideEnv && c.envs.includes('node') && (
        <Chip title="Runs on Node" tone="node">
          NODE
        </Chip>
      )}
      {!hideEnv && c.envs.includes('browser') && (
        <Chip title="Runs in Browser" tone="browser">
          BROWSER
        </Chip>
      )}
      {showStreamOrBatch &&
        (c.stream ? (
          <Chip title="Streaming decode (overlapped with download)" tone="stream">
            STREAM
          </Chip>
        ) : (
          showBatch && (
            <Chip title="Batch decode (full buffer → decode)" tone="batch">
              BATCH
            </Chip>
          )
        ))}
    </span>
  )
}

type Tone = 'node' | 'browser' | 'stream' | 'batch'

const TONE_CLASSES: Record<Tone, string> = {
  node: 'bg-emerald-500/12 text-emerald-300/90 border-emerald-500/25',
  browser: 'bg-sky-500/12 text-sky-300/90 border-sky-500/25',
  stream: 'bg-purple-500/15 text-purple-300/95 border-purple-500/30',
  batch: 'bg-white/5 text-white/45 border-white/15',
}

interface ChipProps {
  tone: Tone
  title?: string
  children: React.ReactNode
}

function Chip({ tone, title, children }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1 py-px text-[9px] font-semibold uppercase tracking-widest ${TONE_CLASSES[tone]}`}
      title={title}
    >
      {children}
    </span>
  )
}
