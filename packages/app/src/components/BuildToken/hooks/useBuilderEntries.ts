'use client'

import { useCallback, useState } from 'react'

import type { BuilderEntry, FileEntry, TextEntry } from '../types'
import { defaultPathForFile } from '../utils/entries-to-builder'

let counter = 0

function nextId(): string {
  counter += 1

  return `e${Date.now().toString(36)}-${counter}`
}

export interface UseBuilderEntriesApi {
  entries: ReadonlyArray<BuilderEntry>
  addText: () => void
  addFiles: (files: ReadonlyArray<File>) => void
  remove: (id: string) => void
  setPath: (id: string, path: string) => void
  setText: (id: string, text: string) => void
  replaceFile: (id: string, file: File) => void
  clear: () => void
}

export function useBuilderEntries(): UseBuilderEntriesApi {
  const [entries, setEntries] = useState<BuilderEntry[]>([])

  const addText = useCallback(() => {
    setEntries(prev => {
      const used = new Set(prev.map(e => e.path))
      let path = 'note.txt'

      for (let i = 2; used.has(path); i++) path = `note-${i}.txt`

      const next: TextEntry = { id: nextId(), kind: 'text', path, text: '' }

      return [...prev, next]
    })
  }, [])

  const addFiles = useCallback((files: ReadonlyArray<File>) => {
    setEntries(prev => {
      const next = [...prev]
      const paths = next.map(e => e.path)

      for (const file of files) {
        const path = defaultPathForFile(file, paths)
        const fileEntry: FileEntry = { id: nextId(), kind: 'file', path, file }

        next.push(fileEntry)
        paths.push(path)
      }

      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  const setPath = useCallback((id: string, path: string) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, path } : e)))
  }, [])

  const setText = useCallback((id: string, text: string) => {
    setEntries(prev => prev.map(e => (e.id === id && e.kind === 'text' ? { ...e, text } : e)))
  }, [])

  const replaceFile = useCallback((id: string, file: File) => {
    setEntries(prev => prev.map(e => (e.id === id && e.kind === 'file' ? { ...e, file } : e)))
  }, [])

  const clear = useCallback(() => setEntries([]), [])

  return { entries, addText, addFiles, remove, setPath, setText, replaceFile, clear }
}
