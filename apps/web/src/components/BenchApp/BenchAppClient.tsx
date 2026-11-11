'use client'

import { useEffect, useRef, useState } from 'react'

import type { BenchFixtureStatus, BenchSize } from '@/lib/benchAppFiles'
import { useSavedBenchRun } from '@/lib/use-saved-bench-run'

import {
  CACHE_MODES,
  type CacheMode,
  type CaseId,
  CASES,
  type LoadScope,
  REPEAT_OPTIONS,
  type RepeatCount,
  SCOPES,
  SIZES,
} from './benchConfig'
import {
  type BenchFrameWindow,
  readFrameWireBytes,
  type RunSample,
  type RunSummary,
  summarizeRuns,
} from './benchSummary'
import { FixtureStatus } from './components/FixtureStatus'
import { MetricsLegend } from './components/MetricsLegend'
import { PseudoCode } from './components/PseudoCode'
import { ScenarioSummary } from './components/ScenarioSummary'
import { TabGroup } from './components/TabGroup'
import { scenarioPseudo } from './scenarioPseudo'
import {
  cacheTabClass,
  repeatTabClass,
  scenarioTabClass,
  scopeTabClass,
  sizeTabClass,
} from './tabStyles'

type RunPhase = 'idle' | 'warming' | 'measuring'
type RunKey = `${BenchSize}:${LoadScope}:${CacheMode}:${CaseId}`

// A pass that hasn't reported boot within this window is considered wedged
// (single dropped request out of ~760, dev-server hiccup). One automatic
// fresh-iframe retry; a second failure aborts the run with the reason shown.
const PASS_TIMEOUT_MS = 45_000

interface BenchAppClientProps {
  fixtures: Record<BenchSize, BenchFixtureStatus>
}

export function BenchAppClient({ fixtures }: BenchAppClientProps) {
  const [size, setSize] = useState<BenchSize>('large')
  const [scope, setScope] = useState<LoadScope>('full')
  const [cacheMode, setCacheMode] = useState<CacheMode>('cold')
  const [repeats, setRepeats] = useState<RepeatCount>(3)
  const [activeId, setActiveId] = useState<CaseId>('router')
  const [started, setStarted] = useState(false)
  const [frameLoaded, setFrameLoaded] = useState(false)
  const [bootDone, setBootDone] = useState(false)
  const [runPhase, setRunPhase] = useState<RunPhase>('idle')
  const [pass, setPass] = useState(1)
  const [summaries, setSummaries] = useState<Partial<Record<RunKey, RunSummary>>>({})
  const [runKey, setRunKey] = useState(0)
  const [runError, setRunError] = useState<string | null>(null)

  useSavedBenchRun(
    'bench-app',
    JSON.stringify({ size, scope, cacheMode, repeats }),
    runPhase !== 'idle',
    summaries,
    setSummaries,
  )

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const samplesRef = useRef<RunSample[]>([])
  const retriesRef = useRef(0)
  const active = CASES.find(item => item.id === activeId) ?? CASES[0]
  const fixture = fixtures[size]
  const activeFrame =
    active.id === 'native-single' && scope === 'random'
      ? '/native-single-random.html'
      : active.id === 'native-chunks' && scope === 'random'
        ? '/native-chunks-random.html'
        : active.frame
  const src = `/bench-app/${size}${activeFrame}?${active.query}&size=${size}&scope=${scope}&cache=${cacheMode}&run=${runKey}`
  const activeSummary = summaries[`${size}:${scope}:${cacheMode}:${activeId}` as RunKey]
  const isRunning = runPhase !== 'idle'

  useEffect(() => {
    if (!started || !frameLoaded || runPhase === 'idle') return

    const reloadFrame = () => {
      setFrameLoaded(false)
      setBootDone(false)
      setRunKey(key => key + 1)
    }

    const retryOrAbort = (reason: string) => {
      if (retriesRef.current < 1) {
        retriesRef.current += 1
        reloadFrame()

        return
      }
      setRunError(`${reason} Retried once without success — re-run to try again.`)
      setRunPhase('idle')
    }

    const timer = window.setInterval(() => {
      try {
        const benchWindow = iframeRef.current?.contentWindow as BenchFrameWindow | null

        if (!benchWindow) return
        const frameRun = new URL(benchWindow.location.href).searchParams.get('run')

        if (frameRun !== String(runKey)) return

        if (benchWindow.__BENCH_ERROR) {
          window.clearInterval(timer)
          retryOrAbort(`Fixture frame failed: ${benchWindow.__BENCH_ERROR}.`)

          return
        }

        if (benchWindow.__BENCH_BOOT_DONE) {
          if (runPhase === 'warming') {
            setRunPhase('measuring')
            reloadFrame()
            window.clearInterval(timer)

            return
          }

          const sample: RunSample = {
            totalMs: benchWindow.__BENCH_BOOT_DONE ?? 0,
            phases: benchWindow.__BENCH_PHASES ?? {},
            bytes: readFrameWireBytes(benchWindow),
          }

          samplesRef.current = [...samplesRef.current, sample]
          retriesRef.current = 0

          if (samplesRef.current.length < repeats) {
            setPass(samplesRef.current.length + 1)
            reloadFrame()
            window.clearInterval(timer)

            return
          }

          const summaryKey = `${size}:${scope}:${cacheMode}:${activeId}` as const

          setSummaries(current => ({
            ...current,
            [summaryKey]: summarizeRuns(samplesRef.current),
          }))
          setBootDone(true)
          setRunPhase('idle')
          window.clearInterval(timer)
        }
      } catch {
        // Transient read failures (frame mid-navigation) must not kill the
        // poll loop — the watchdog below handles genuinely wedged passes.
      }
    }, 150)

    return () => window.clearInterval(timer)
  }, [cacheMode, frameLoaded, activeId, repeats, runKey, runPhase, scope, size, started])

  useEffect(() => {
    if (!started || runPhase === 'idle') return

    const startedAt = Date.now()
    const watchdog = window.setInterval(() => {
      if (Date.now() - startedAt < PASS_TIMEOUT_MS) return
      window.clearInterval(watchdog)
      if (retriesRef.current < 1) {
        retriesRef.current += 1
        setFrameLoaded(false)
        setBootDone(false)
        setRunKey(key => key + 1)
      } else {
        setRunError(
          `Pass timed out after ${PASS_TIMEOUT_MS / 1000}s — the fixture frame never reported boot. Retried once without success — re-run to try again.`,
        )
        setRunPhase('idle')
      }
    }, 1_000)

    return () => window.clearInterval(watchdog)
  }, [runKey, runPhase, started])

  function startBench() {
    if (isRunning) return
    samplesRef.current = []
    retriesRef.current = 0
    setRunError(null)
    setPass(1)
    setStarted(true)
    setFrameLoaded(false)
    setBootDone(false)
    setRunPhase(cacheMode === 'warm' ? 'warming' : 'measuring')
    setRunKey(key => key + 1)
  }

  function resetRun() {
    samplesRef.current = []
    retriesRef.current = 0
    setRunError(null)
    setPass(1)
    setStarted(false)
    setFrameLoaded(false)
    setBootDone(false)
    setRunPhase('idle')
  }

  function selectCase(id: CaseId) {
    setActiveId(id)
    resetRun()
  }

  function selectSize(nextSize: BenchSize) {
    setSize(nextSize)
    resetRun()
  }

  function selectScope(nextScope: LoadScope) {
    setScope(nextScope)
    resetRun()
  }

  function selectCacheMode(nextMode: CacheMode) {
    setCacheMode(nextMode)
    resetRun()
  }

  function selectRepeats(nextRepeats: RepeatCount) {
    setRepeats(nextRepeats)
    resetRun()
  }

  const runButtonLabel =
    runPhase === 'warming'
      ? 'Warming cache...'
      : runPhase === 'measuring'
        ? repeats > 1
          ? `Running ${pass}/${repeats}...`
          : 'Running bench...'
        : activeSummary
          ? 'Re-run bench'
          : 'Run bench'

  return (
    <div className="grid gap-6">
      <div>
        <div className="font-mono text-[10px] tracking-[0.16em] text-tp-soft uppercase">
          Run shape
        </div>
        <div className="mt-1 font-mono text-[14px] leading-tight font-medium text-tp-fg">
          {size} · {active.label}
        </div>
      </div>

      <section className="rounded-lg border border-tp-border bg-tp-elev2 p-4 lg:p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,0.66fr)_minmax(0,0.6fr)_minmax(0,0.66fr)] xl:items-center">
          <TabGroup label="Fixture size">
            <div className="grid gap-2 sm:grid-cols-3">
              {SIZES.map(item => (
                <button
                  key={item.id}
                  className={sizeTabClass(item.id === size)}
                  type="button"
                  onClick={() => selectSize(item.id)}
                >
                  <span className="block text-[12px] leading-none">{item.label}</span>
                  <span className="mt-1 block text-[10px] leading-none opacity-70">
                    {item.note}
                  </span>
                </button>
              ))}
            </div>
          </TabGroup>
          <TabGroup label="Load scope">
            <div className="grid gap-2 sm:grid-cols-2">
              {SCOPES.map(item => (
                <button
                  key={item.id}
                  className={scopeTabClass(item.id === scope)}
                  type="button"
                  onClick={() => selectScope(item.id)}
                >
                  <span className="block text-[12px] leading-none">{item.label}</span>
                  <span className="mt-1 block text-[10px] leading-none opacity-70">
                    {item.note}
                  </span>
                </button>
              ))}
            </div>
          </TabGroup>
          <TabGroup label="Cache mode">
            <div className="grid gap-2 sm:grid-cols-2">
              {CACHE_MODES.map(item => (
                <button
                  key={item.id}
                  className={cacheTabClass(item.id === cacheMode)}
                  type="button"
                  onClick={() => selectCacheMode(item.id)}
                >
                  <span className="block text-[12px] leading-none">{item.label}</span>
                  <span className="mt-1 block text-[10px] leading-none opacity-70">
                    {item.note}
                  </span>
                </button>
              ))}
            </div>
          </TabGroup>
          <TabGroup label="Repeats">
            <div className="grid gap-2 sm:grid-cols-3">
              {REPEAT_OPTIONS.map(item => (
                <button
                  key={item.id}
                  className={repeatTabClass(item.id === repeats)}
                  type="button"
                  onClick={() => selectRepeats(item.id)}
                >
                  <span className="block text-[12px] leading-none">{item.label}</span>
                  <span className="mt-1 block text-[10px] leading-none opacity-70">
                    {item.note}
                  </span>
                </button>
              ))}
            </div>
          </TabGroup>
        </div>
      </section>

      <FixtureStatus fixture={fixture} scope={scope} />

      <section className="rounded-lg border border-tp-border bg-tp-elev2 p-5 lg:p-6">
        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <h2 className="text-[22px] leading-tight font-medium tracking-[-0.02em]">
              {active.title}
            </h2>
            <p className="mt-2 text-[13px] leading-snug text-tp-muted">{active.body}</p>
          </div>
          <div className="grid gap-3">
            <div className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
              {scope === 'random' ? '50% deterministic random request set' : 'full app boot'}
            </div>
            <ul className="grid gap-2 text-[11.5px] leading-tight text-tp-muted">
              {active.details.map(detail => (
                <li key={detail} className="flex gap-2 rounded-md bg-tp-bg/45 px-3 py-2">
                  <span className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full bg-tp-accent" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
            <PseudoCode lines={scenarioPseudo(active.id, scope)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-tp-border bg-tp-elev2 p-4 lg:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <div className="font-mono text-[10px] tracking-[0.16em] text-tp-soft uppercase">
              Scenarios
            </div>
            <p className="mt-1 max-w-3xl text-[12px] leading-snug text-tp-muted">
              Pick the delivery path, then run the selected {size} fixture. The iframe stays idle
              until you start it.
            </p>
          </div>
          <button
            className="w-full cursor-pointer rounded-md bg-tp-accent px-4 py-2.5 font-mono text-[12px] font-medium text-tp-accent-fg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
            disabled={isRunning}
            type="button"
            onClick={startBench}
          >
            {runButtonLabel}
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-5">
          {CASES.map(item => (
            <button
              key={item.id}
              className={scenarioTabClass(item.id === active.id)}
              type="button"
              onClick={() => selectCase(item.id)}
            >
              <span className="flex min-h-5 items-start justify-between gap-2">
                <span className="leading-tight">{item.label}</span>
                {'token' in item && item.token && (
                  <span className="shrink-0 rounded-sm border border-tp-accent/45 bg-tp-accent/15 px-1.5 py-0.5 text-[8px] leading-none tracking-[0.12em] text-tp-accent">
                    TOKEN
                  </span>
                )}
              </span>
              <span className="mt-1 block text-[10px] leading-tight text-tp-muted">
                {item.title}
              </span>
              <ScenarioSummary
                summary={summaries[`${size}:${scope}:${cacheMode}:${item.id}` as RunKey]}
              />
            </button>
          ))}
        </div>

        {runError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 font-mono text-[11px] leading-relaxed text-red-200">
            {runError}
          </div>
        )}

        <MetricsLegend />
      </section>

      <section className="overflow-hidden rounded-lg border border-tp-border bg-tp-elev2 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="relative">
          {!started && (
            <div className="grid h-[720px] items-start justify-center bg-[#0e0e10] p-6 pt-12">
              <div className="max-w-lg rounded-lg border border-tp-border bg-tp-elev2/95 px-5 py-4 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
                <div className="font-mono text-[12px] text-tp-fg">
                  Ready: {size} / {scope === 'random' ? '50% random' : 'full app'} / {active.label}
                  {' / '}
                  {cacheMode} / {repeats}×
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-tp-muted">
                  Use the run button in Scenarios to start this isolated iframe benchmark.
                </p>
              </div>
            </div>
          )}
          {started && isRunning && (!frameLoaded || !bootDone) && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-tp-bg/80 backdrop-blur-sm">
              <div className="grid justify-items-center gap-4 rounded-lg border border-tp-border bg-tp-elev2 px-6 py-5 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-tp-border border-t-tp-accent" />
                <div>
                  <div className="font-mono text-[12px] text-tp-fg">
                    {runPhase === 'warming'
                      ? 'Warming browser cache'
                      : !frameLoaded
                        ? `Loading isolated frame${repeats > 1 ? ` (pass ${pass}/${repeats})` : ''}`
                        : `Running measured benchmark${repeats > 1 ? ` (pass ${pass}/${repeats})` : ''}`}
                  </div>
                  <div className="mt-1 max-w-xs text-[12px] leading-relaxed text-tp-muted">
                    {runPhase === 'warming'
                      ? 'This primer pass is not reported. The measured run starts automatically after assets are cacheable.'
                      : `${active.label} loads inside its own iframe so scripts, globals, and DOM state do not bleed between cases.`}
                  </div>
                </div>
              </div>
            </div>
          )}
          {started && (
            <iframe
              key={`${active.id}-${runKey}`}
              ref={iframeRef}
              className="h-[720px] w-full bg-[#0e0e10]"
              src={src}
              title={`bench-app ${active.label}`}
              onLoad={() => setFrameLoaded(true)}
            />
          )}
        </div>
      </section>
    </div>
  )
}
