export interface PhaseFailure {
  message: string
  timedOut: boolean
}

export function phaseFailure(err: unknown): PhaseFailure {
  const message = err instanceof Error ? err.message : String(err)
  const timedOut =
    err instanceof Error &&
    (err.name === 'TimeoutError' || /Timeout \d+ms exceeded|timed out/i.test(message))

  return { message, timedOut }
}
