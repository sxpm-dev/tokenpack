'use client'

import { Button, Card } from '@heroui/react'
import { useRef, useState } from 'react'

import { FileTree } from './components/FileTree'
import { UploadArea } from './components/UploadArea'
import type { DecodeResult } from './types'

export function DecodeToken() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null

    setFile(f)
    setResult(null)
    setError(null)
    if (f) setPreviewUrl(URL.createObjectURL(f))
    else setPreviewUrl(null)
  }

  function handleReset() {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDecode() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const form = new FormData()

      form.append('token', file)
      const res = await fetch('/api/decode', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <UploadArea
        ref={fileRef}
        file={file}
        previewUrl={previewUrl}
        onFileChange={handleFileChange}
        onPickClick={() => fileRef.current?.click()}
        onReset={handleReset}
      />

      {file && (
        <Button fullWidth isPending={loading} onPress={handleDecode}>
          {loading ? 'Decoding…' : 'Decode Token'}
        </Button>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 font-mono whitespace-pre-wrap">
          {error}
        </div>
      )}

      {result && (
        <Card className="p-3" variant="secondary">
          <Card.Header className="pb-2">
            <Card.Title className="text-[13px] font-medium text-white/65">
              {result.type === 'text' && 'Text content'}
              {result.type === 'filesystem' && `Filesystem · ${result.files.length} files`}
              {result.type === 'binary' && 'Binary content'}
            </Card.Title>
          </Card.Header>
          <Card.Content>
            {result.type === 'text' && (
              <pre className="max-h-[360px] overflow-auto rounded-lg bg-black/25 p-3 text-xs font-mono leading-relaxed text-green-300/80 whitespace-pre-wrap break-all">
                {result.content}
              </pre>
            )}
            {result.type === 'filesystem' && <FileTree files={result.files} />}
            {result.type === 'binary' && (
              <div className="text-white/40 text-sm">{result.size.toLocaleString()} bytes</div>
            )}
          </Card.Content>
        </Card>
      )}
    </div>
  )
}
