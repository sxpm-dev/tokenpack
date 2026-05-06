'use client'

import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react'
import { GitDiffIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import { DiffImage } from './components/DiffImage'
import { DiffText } from './components/DiffText'
import { TokenSlot } from './components/TokenSlot'

type DiffMode = 'image' | 'text'

export function DiffTokens() {
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [urlA, setUrlA] = useState<string | null>(null)
  const [urlB, setUrlB] = useState<string | null>(null)
  const [mode, setMode] = useState<DiffMode>('image')
  const [loading, setLoading] = useState(false)
  const [diffUrl, setDiffUrl] = useState<string | null>(null)
  const [textDiff, setTextDiff] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function clearResult() {
    setDiffUrl(null)
    setTextDiff(null)
  }

  function setA(f: File) {
    setFileA(f)
    setUrlA(URL.createObjectURL(f))
    clearResult()
  }
  function setB(f: File) {
    setFileB(f)
    setUrlB(URL.createObjectURL(f))
    clearResult()
  }
  function resetA() {
    setFileA(null)
    setUrlA(null)
    clearResult()
  }
  function resetB() {
    setFileB(null)
    setUrlB(null)
    clearResult()
  }

  async function handleDiff() {
    if (!fileA || !fileB) return
    setLoading(true)
    setError(null)
    clearResult()

    try {
      const form = new FormData()

      form.append('tokenA', fileA)
      form.append('tokenB', fileB)
      form.append('mode', mode)

      const res = await fetch('/api/diff', { method: 'POST', body: form })

      if (mode === 'image') {
        if (!res.ok) {
          const j = await res.json()

          throw new Error(j.error)
        }
        const blob = await res.blob()

        setDiffUrl(URL.createObjectURL(blob))
      } else {
        const data = await res.json()

        if (!res.ok) throw new Error(data.error)
        setTextDiff(data.content)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <TokenSlot
          file={fileA}
          label="Token A (before)"
          previewUrl={urlA}
          onFile={setA}
          onReset={resetA}
        />
        <TokenSlot
          file={fileB}
          label="Token B (after)"
          previewUrl={urlB}
          onFile={setB}
          onReset={resetB}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleButtonGroup
          disallowEmptySelection
          selectedKeys={new Set([mode])}
          selectionMode="single"
          size="sm"
          onSelectionChange={keys => {
            const [k] = [...(keys as Set<string>)]

            if (k) setMode(k as DiffMode)
          }}
        >
          <ToggleButton id="image">visual</ToggleButton>
          <ToggleButton id="text">text</ToggleButton>
        </ToggleButtonGroup>

        <Button isDisabled={!fileA || !fileB} isPending={loading} size="sm" onPress={handleDiff}>
          <GitDiffIcon size={16} />
          {loading ? 'Comparing…' : 'Compare Tokens'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 font-mono">
          {error}
        </div>
      )}

      {diffUrl && <DiffImage url={diffUrl} />}
      {textDiff && <DiffText content={textDiff} />}
    </div>
  )
}
