'use client'

import { useState } from 'react'
import { Button, Chip, Input, Tabs } from '@heroui/react'
import { LockIcon, SlidersIcon, StarIcon } from '@phosphor-icons/react'
import { AlgorithmSection } from './components/AlgorithmSection'
import { CompressorSection } from './components/CompressorSection'
import { DefaultPresets } from './components/DefaultPresets'
import { DrawerSection } from './components/DrawerSection'
import { InputModeTabs } from './components/InputModeTabs'
import { SurfaceSection } from './components/SurfaceSection'
import { TokenResult } from './components/TokenResult'
import type {
  ConfigMode,
  DefaultPresetName,
  DrawerChoice,
  GradientDirection,
  ImageFormat,
  InputMode,
  SizeStats,
} from './types'
import {
  appendDefaultAlgorithm,
  getDefaultAlgorithmFormat,
  hexToRgb,
  mimeForFormat,
} from './utils'

export function CreateToken() {
  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [configMode, setConfigMode] = useState<ConfigMode>('default')
  const [defaultPreset, setDefaultPreset] = useState<DefaultPresetName>('max')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isZip, setIsZip] = useState(false)
  const [unzip, setUnzip] = useState(false)
  const [preset, setPreset] = useState('none')
  const [algo, setAlgo] = useState('linear')
  const [compressionMode, setCompressionMode] = useState('brotli-11')
  const [drawer, setDrawer] = useState<DrawerChoice>('dense')
  const [cellSize, setCellSize] = useState('1')
  const [key, setKey] = useState('')
  const [bpp, setBpp] = useState<number>(4)
  const [imgFormat, setImgFormat] = useState<ImageFormat>('webp')
  const [streaming, setStreaming] = useState(false)
  const [useBackground, setUseBackground] = useState(false)
  const [gradientFrom, setGradientFrom] = useState('#ff0050')
  const [gradientTo, setGradientTo] = useState('#0050ff')
  const [gradientDirection, setGradientDirection] = useState<GradientDirection>('diagonal')
  const [backgroundOpacity, setBackgroundOpacity] = useState(100)
  const [loading, setLoading] = useState(false)
  const [tokenUrl, setTokenUrl] = useState<string | null>(null)
  const [tokenFileName, setTokenFileName] = useState<string>('token.png')
  const [error, setError] = useState<string | null>(null)
  const [sizeStats, setSizeStats] = useState<SizeStats | null>(null)

  // WebP alpha premultiplication makes bpp=4 unsafe.
  const isWebP = imgFormat === 'webp'
  const effectiveBpp = isWebP && bpp === 4 ? 3 : bpp
  const supportsDrawerBackground = drawer === 'dot'
  const effectiveCellSize = drawer === 'dot' ? cellSize : '1'

  function getInputBytes() {
    if (inputMode === 'text') return new TextEncoder().encode(text).length
    return file?.size ?? 0
  }

  function clearResult() {
    setTokenUrl(null)
    setSizeStats(null)
    setError(null)
  }

  function handleFileChange(next: File | null) {
    setFile(next)
    setIsZip(next?.name.endsWith('.zip') ?? false)
    setUnzip(false)
    clearResult()
  }

  function handleTextChange(next: string) {
    setText(next)
    clearResult()
  }

  function handleInputModeChange(next: InputMode) {
    setInputMode(next)
    clearResult()
  }

  function handleImgFormatChange(next: ImageFormat) {
    setImgFormat(next)
    if (next !== 'png') setStreaming(false)
  }

  function appendManualOptions(form: FormData) {
    if (preset !== 'none') {
      form.append('preset', preset)
    } else {
      form.append('algo', algo)
      form.append('cellSize', effectiveCellSize)
      form.append('channels', String(effectiveBpp))
      form.append('format', imgFormat)
      if (streaming && imgFormat === 'png') form.append('streaming', 'true')
      if (supportsDrawerBackground && useBackground) {
        form.append('style', JSON.stringify({
          gradient: {
            from: hexToRgb(gradientFrom),
            to: hexToRgb(gradientTo),
            direction: gradientDirection,
          },
          opacity: backgroundOpacity / 100,
        }))
      }
    }
    form.append('compressionMode', compressionMode)
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setTokenUrl(null)
    setSizeStats(null)

    const inputBytes = getInputBytes()

    try {
      const isPackMode = inputMode === 'file' && file && isZip && unzip
      const outputFormat = configMode === 'default'
        ? getDefaultAlgorithmFormat(defaultPreset)
        : imgFormat
      const fileName = `token.${outputFormat}`
      setTokenFileName(fileName)

      const form = new FormData()
      if (isPackMode && file) {
        form.append('file', file)
        form.append('unzip', 'true')
      } else if (inputMode === 'text') {
        form.append('text', text)
      } else if (file) {
        form.append('file', file)
      }

      if (configMode === 'manual') appendManualOptions(form)
      else appendDefaultAlgorithm(form, defaultPreset)
      if (key) form.append('key', key)

      const endpoint = isPackMode ? '/api/pack' : '/api/encode'
      const res = await fetch(endpoint, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const imgBytes = Uint8Array.from(atob(data.token), c => c.charCodeAt(0))
      const blob = new Blob([imgBytes], { type: mimeForFormat(outputFormat) })
      setTokenUrl(URL.createObjectURL(blob))
      setSizeStats({
        inputBytes,
        tokenBytes: blob.size,
        gzipBytes: data.gzipSize ?? null,
        brotliBytes: data.brotliSize ?? null,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = inputMode === 'text' ? text.length > 0 : file !== null
  const showManual = configMode === 'manual'
  const showManualDetails = showManual && preset === 'none'

  return (
    <div className="flex flex-col gap-3">

      <InputModeTabs
        mode={inputMode}
        onModeChange={handleInputModeChange}
        text={text}
        onTextChange={handleTextChange}
        file={file}
        onFileChange={handleFileChange}
        isZip={isZip}
        unzip={unzip}
        onUnzipChange={setUnzip}
      />

      <Tabs
        selectedKey={configMode}
        onSelectionChange={key => setConfigMode(key as ConfigMode)}
      >
        <Tabs.List className="w-fit">
          <Tabs.Tab id="default">
            <StarIcon size={18} className="text-accent mr-2" />
            Default
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="manual">
            <SlidersIcon size={18} className="text-accent mr-2" />
            Manual
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="default" className="p-0">
          <DefaultPresets value={defaultPreset} onChange={setDefaultPreset} />
        </Tabs.Panel>

        <Tabs.Panel id="manual" className="p-0">
          <div className="grid gap-3 lg:grid-cols-2">
            <AlgorithmSection
              preset={preset}
              onPresetChange={setPreset}
              algo={algo}
              onAlgoChange={setAlgo}
            />

            {showManualDetails && (
              <>
                <DrawerSection
                  drawer={drawer}
                  onDrawerChange={setDrawer}
                  cellSize={cellSize}
                  onCellSizeChange={setCellSize}
                  useBackground={useBackground}
                  onUseBackgroundChange={setUseBackground}
                  gradientFrom={gradientFrom}
                  onGradientFromChange={setGradientFrom}
                  gradientTo={gradientTo}
                  onGradientToChange={setGradientTo}
                  gradientDirection={gradientDirection}
                  onGradientDirectionChange={setGradientDirection}
                  backgroundOpacity={backgroundOpacity}
                  onBackgroundOpacityChange={setBackgroundOpacity}
                />

                <SurfaceSection
                  imgFormat={imgFormat}
                  onImgFormatChange={handleImgFormatChange}
                  effectiveBpp={effectiveBpp}
                  onBppChange={setBpp}
                  streaming={streaming}
                  onStreamingChange={setStreaming}
                />

                <CompressorSection
                  value={compressionMode}
                  onChange={setCompressionMode}
                />
              </>
            )}
          </div>
        </Tabs.Panel>
      </Tabs>

      <Input
        type="password"
        value={key}
        onChange={e => setKey(e.target.value)}
        placeholder="Encryption key (optional)"
        variant="secondary"
        fullWidth
        className="!rounded-2xl"
      />
      <div>
        {key && (
          <Chip size="sm" variant="soft" color="warning">
            <LockIcon size={12} /> AES-256
          </Chip>
        )}
      </div>

      <Button size="sm" onPress={handleGenerate} isPending={loading} isDisabled={!canGenerate}>
        {loading ? 'Generating…' : 'Generate Token'}
      </Button>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 font-mono whitespace-pre-wrap">
          {error}
        </div>
      )}

      {tokenUrl && sizeStats && (
        <TokenResult url={tokenUrl} fileName={tokenFileName} stats={sizeStats} />
      )}
    </div>
  )
}
