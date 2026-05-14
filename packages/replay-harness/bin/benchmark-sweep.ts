import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

interface SweepRun {
  label: string
  script: string
}

interface SweepResult extends SweepRun {
  exitCode: number
  durationMs: number
  report?: string
  json?: string
  csv?: string
  log?: string
  console?: string
  consoleLog?: string
  screenshots?: string
}

const SWEEP_3: SweepRun[] = [
  { label: 'service', script: 'benchmark:sw:service:3' },
  { label: 'bundle-single', script: 'benchmark:sw:bundle-single:3' },
  { label: 'bundle20', script: 'benchmark:sw:bundle20:3' },
]

const ROUTER_SWEEP_3: SweepRun[] = [
  { label: 'router-sw-isolate', script: 'benchmark:router:sw:isolate:3' },
  { label: 'router-sw-remote', script: 'benchmark:router:sw:remote:3' },
  { label: 'router-cdp-isolate', script: 'benchmark:router:cdp:isolate:3' },
  { label: 'router-cdp-remote', script: 'benchmark:router:cdp:remote:3' },
]

const sweepName = process.argv[2] ?? 'sw:sweep:3'
const runs = resolveRuns(sweepName)
const results: SweepResult[] = []
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

for (const run of runs) {
  results.push(await runScript(run))
  const last = results[results.length - 1]

  if (last.exitCode !== 0) {
    printSummary(results)
    process.exit(last.exitCode)
  }
}

printSummary(results)

function resolveRuns(name: string): SweepRun[] {
  if (name === 'sw:sweep:3') return SWEEP_3
  if (name === 'router:sweep:3') return ROUTER_SWEEP_3

  throw new Error(`Unknown benchmark sweep: ${name}`)
}

async function runScript(run: SweepRun): Promise<SweepResult> {
  const started = performance.now()
  const result: SweepResult = { ...run, exitCode: 0, durationMs: 0 }

  process.stdout.write(`\n=== ${run.label} (${run.script}) ===\n`)

  const child = spawn('yarn', ['run', run.script], {
    cwd: packageRoot,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', chunk => {
    process.stdout.write(chunk)
    capturePaths(result, chunk)
  })
  child.stderr.on('data', chunk => {
    process.stderr.write(chunk)
    capturePaths(result, chunk)
  })

  result.exitCode = await new Promise<number>((resolve, reject) => {
    child.on('error', reject)
    child.on('close', code => resolve(code ?? 1))
  })
  result.durationMs = performance.now() - started

  return result
}

function capturePaths(result: SweepResult, text: string): void {
  for (const line of text.split(/\r?\n/)) {
    const match = /^(Report|JSON|CSV|Log|Console|Console log|Screenshots):\s+(.+?)\s*$/.exec(
      line.trim(),
    )

    if (!match) continue
    const [, key, value] = match

    if (key === 'Report') result.report = value
    if (key === 'JSON') result.json = value
    if (key === 'CSV') result.csv = value
    if (key === 'Log') result.log = value
    if (key === 'Console') result.console = value
    if (key === 'Console log') result.consoleLog = value
    if (key === 'Screenshots') result.screenshots = value
  }
}

function printSummary(results: readonly SweepResult[]): void {
  process.stdout.write('\n=== Benchmark sweep reports ===\n')
  for (const result of results) {
    const status = result.exitCode === 0 ? 'ok' : `failed (${result.exitCode})`
    const seconds = (result.durationMs / 1000).toFixed(1)

    process.stdout.write(`${result.label.padEnd(14)} ${status.padEnd(12)} ${seconds}s\n`)
    if (result.report) process.stdout.write(`  Report:      ${result.report}\n`)
    if (result.json) process.stdout.write(`  JSON:        ${result.json}\n`)
    if (result.csv) process.stdout.write(`  CSV:         ${result.csv}\n`)
    if (result.log) process.stdout.write(`  Log:         ${result.log}\n`)
    if (result.console) process.stdout.write(`  Console:     ${result.console}\n`)
    if (result.consoleLog) process.stdout.write(`  Console log: ${result.consoleLog}\n`)
    if (result.screenshots) process.stdout.write(`  Screenshots: ${result.screenshots}\n`)
  }
  process.stdout.write('\n')
}
