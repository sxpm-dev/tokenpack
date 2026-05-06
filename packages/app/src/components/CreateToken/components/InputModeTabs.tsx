'use client'

import { Button, Checkbox, Tabs, TextArea } from '@heroui/react'
import { FileIcon, TextTIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import { useRef } from 'react'

import type { InputMode } from '../types'
import { formatBytes } from '../utils'

interface InputModeTabsProps {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
  text: string
  onTextChange: (text: string) => void
  file: File | null
  onFileChange: (file: File | null) => void
  isZip: boolean
  unzip: boolean
  onUnzipChange: (value: boolean) => void
}

export function InputModeTabs({
  mode,
  onModeChange,
  text,
  onTextChange,
  file,
  onFileChange,
  isZip,
  unzip,
  onUnzipChange,
}: InputModeTabsProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null

    onFileChange(f)
  }

  return (
    <Tabs selectedKey={mode} onSelectionChange={key => onModeChange(key as InputMode)}>
      <Tabs.List className="w-fit">
        <Tabs.Tab id="text">
          <TextTIcon className="text-accent mr-2" size={18} />
          Text
          <Tabs.Indicator />
        </Tabs.Tab>
        <Tabs.Tab id="file">
          <FileIcon className="text-accent mr-2" size={18} />
          File
          <Tabs.Indicator />
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel className="p-0" id="text">
        <TextArea
          fullWidth
          className="min-h-[210px] font-mono text-[13px] !rounded-2xl"
          placeholder="Paste your source code or any text here…"
          rows={7}
          value={text}
          variant="secondary"
          onChange={e => onTextChange(e.target.value)}
        />
      </Tabs.Panel>

      <Tabs.Panel className="p-0" id="file">
        <div className="flex flex-col gap-2">
          <Button
            className="min-h-24 w-full border border-dashed border-white/18"
            variant="secondary"
            onPress={() => fileRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <UploadSimpleIcon className="text-white/30" size={24} />
              {file ? (
                <span className="text-white/80 font-medium">
                  {file.name}
                  <span className="text-white/40 ml-2">({formatBytes(file.size)})</span>
                </span>
              ) : (
                'Click to upload a file or .zip'
              )}
              <input ref={fileRef} className="hidden" type="file" onChange={handleFileChange} />
            </div>
          </Button>

          {isZip && (
            <Checkbox isSelected={unzip} variant="secondary" onChange={onUnzipChange}>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>Unzip and pack as filesystem token</Checkbox.Content>
            </Checkbox>
          )}
        </div>
      </Tabs.Panel>
    </Tabs>
  )
}
