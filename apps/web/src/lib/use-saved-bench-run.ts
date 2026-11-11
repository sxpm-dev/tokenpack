'use client'

/* eslint-disable react-hooks/set-state-in-effect -- Synchronize displayed measurements with the external saved-run store when its configuration key changes. */

import { useEffect, useRef, useState } from 'react'

/** Persist completed runs and restore only runs matching the current fixtures and controls. */
export function useSavedBenchRun<T>(
  scope: string,
  config: string,
  running: boolean,
  result: T,
  restore: (value: T) => void,
) {
  const [message, setMessage] = useState('')
  const wasRunning = useRef(false)
  const resultRef = useRef(result)
  const initialResult = useRef(result)
  const runEpoch = useRef(0)
  const runConfig = useRef({ scope, config })
  const restoreRef = useRef(restore)

  useEffect(() => {
    resultRef.current = result
    restoreRef.current = restore
  }, [result, restore])
  useEffect(() => {
    const controller = new AbortController()

    setMessage('')
    restoreRef.current(initialResult.current)
    const epoch = runEpoch.current

    fetch(`/api/bench-runs?scope=${scope}&config=${encodeURIComponent(config)}`, {
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error('Could not load saved measurements')

        return response.json()
      })
      .then(saved => {
        if (
          saved &&
          !controller.signal.aborted &&
          !wasRunning.current &&
          epoch === runEpoch.current
        ) {
          restoreRef.current(saved.result)
          setMessage(`Saved run · ${new Date(saved.createdAt).toLocaleString()} · ${saved.mode}`)
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') setMessage(error.message)
      })

    return () => controller.abort()
  }, [scope, config])
  useEffect(() => {
    const completed = wasRunning.current && !running
    const started = !wasRunning.current && running

    wasRunning.current = running
    if (started) {
      runEpoch.current += 1
      runConfig.current = { scope, config }
    }
    if (!completed) return
    if (runConfig.current.scope !== scope || runConfig.current.config !== config) {
      restoreRef.current(initialResult.current)
      setMessage('Configuration changed during measurement. Run again to save results.')

      return
    }
    let active = true

    setMessage('Saving measurements…')
    fetch('/api/bench-runs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ scope, config, result: resultRef.current }),
    })
      .then(response => {
        if (!response.ok) throw new Error('Could not save measurements')

        return response.json()
      })
      .then(saved => {
        if (active)
          setMessage(`Saved run · ${new Date(saved.createdAt).toLocaleString()} · ${saved.mode}`)
      })
      .catch(error => {
        if (active) setMessage(error.message)
      })

    return () => {
      active = false
    }
  }, [scope, config, running])

  return message
}
