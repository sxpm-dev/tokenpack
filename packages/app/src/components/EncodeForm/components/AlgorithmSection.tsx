'use client'

import { Chip, ListBox, Select } from '@heroui/react'
import { algorithmCatalog } from 'tokenpack/algorithms/catalog'
import type { AlgorithmCtor } from 'tokenpack/algorithms/types'

import { Section } from './Section'

interface AlgorithmSectionProps {
  algo: string
  onAlgoChange: (algo: string) => void
}

interface Binding {
  name: string
  title: string
  codec: string
  codecDescription: string
  surface: string
  surfaceDescription: string
  compressor: string
  compressorDescription: string
  drawer: string
  drawerDescription: string
  environments: ('node' | 'browser')[]
  streamable: boolean
}

interface CodecLike {
  name: string
  metadata?: { description?: string }
}

interface SurfaceLike {
  id: string
  description?: string
}

interface DrawerLike {
  id: string
  description?: string
}

function describe(Ctor: AlgorithmCtor): Binding {
  const codec = new (Ctor.Codec as unknown as new () => CodecLike)()
  const surface = new (Ctor.Surface as unknown as new () => SurfaceLike)()
  const drawer = new (Ctor.Drawer as unknown as new () => DrawerLike)()
  const ctorMeta = Ctor as unknown as { title?: string; name: string }
  const compressorCtor = Ctor.Compressor as unknown as {
    familyId: string
    description?: string
  }

  return {
    name: ctorMeta.name,
    title: ctorMeta.title ?? ctorMeta.name,
    codec: codec.name,
    codecDescription: codec.metadata?.description ?? '',
    surface: surface.id,
    surfaceDescription: surface.description ?? '',
    compressor: compressorCtor.familyId,
    compressorDescription: compressorCtor.description ?? '',
    drawer: drawer.id,
    drawerDescription: drawer.description ?? '',
    environments: [...Ctor.capabilities.environments],
    streamable: Ctor.capabilities.streamable,
  }
}

function listBindings(): Binding[] {
  return algorithmCatalog.list().map(describe)
}

export function AlgorithmSection({ algo, onAlgoChange }: AlgorithmSectionProps) {
  const bindings = listBindings()
  const selected = bindings.find(b => b.name === algo)

  return (
    <Section
      className="lg:col-span-2"
      description="The bound recipe — codec / surface / compressor / drawer. Pick by full configuration."
      title="Algorithm"
    >
      <Select
        selectedKey={algo}
        variant="secondary"
        onSelectionChange={key => {
          if (key !== null) onAlgoChange(String(key))
        }}
      >
        <Select.Trigger>
          <Select.Value>
            {selected ? (
              <span className="flex items-center gap-2 w-full">
                <span className="font-mono text-[12px]">{selected.name}</span>
                <span className="text-[10px] text-white/40">{describeBinding(selected)}</span>
              </span>
            ) : (
              <span className="text-white/40">Select an algorithm</span>
            )}
          </Select.Value>
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox aria-label="Algorithm">
            {bindings.map(b => (
              <ListBox.Item key={b.name} id={b.name} textValue={b.name}>
                <span className="flex flex-col items-start gap-0.5 leading-tight w-full">
                  <span className="text-[12px] font-mono">{b.name}</span>
                  <span className="text-[10px] text-white/45 font-mono tabular-nums">
                    {describeBinding(b)}
                  </span>
                </span>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      {selected && (
        <div className="flex flex-wrap gap-1.5">
          <Chip
            color={selected.streamable ? 'success' : 'default'}
            size="sm"
            title={
              selected.streamable
                ? 'Decode can pipeline with download (overlapped network + decode).'
                : 'Decoder waits for the full token before producing output.'
            }
            variant="soft"
          >
            {selected.streamable ? 'streamable' : 'not streamable'}
          </Chip>
          <Chip
            color={selected.environments.includes('browser') ? 'success' : 'warning'}
            size="sm"
            title={
              selected.environments.includes('browser')
                ? 'Encode runs entirely in-browser via CompressionStream + canvas.'
                : "Encode requires the server (CompressionStream('br') is not implemented in browsers)."
            }
            variant="soft"
          >
            {selected.environments.includes('browser') ? 'browser friendly' : 'node only'}
          </Chip>
          <Chip
            size="sm"
            title={
              selected.codecDescription ||
              'Pixel layout: how bytes are mapped onto pixel positions.'
            }
            variant="tertiary"
          >
            codec: {selected.codec}
          </Chip>
          <Chip
            size="sm"
            title={
              selected.surfaceDescription ||
              'Image container that wraps the encoded pixels (or hosts the data side-channel for PixelRange).'
            }
            variant="tertiary"
          >
            surface: {selected.surface}
          </Chip>
          <Chip
            size="sm"
            title={
              selected.compressorDescription ||
              'Outer compression family applied before bytes are written into pixels.'
            }
            variant="tertiary"
          >
            compressor: {selected.compressor}
          </Chip>
          <Chip
            size="sm"
            title={
              selected.drawerDescription ||
              'Pixel-render style. `dense` packs bytes into adjacent pixels; `dot` lays them as sparse cells.'
            }
            variant="tertiary"
          >
            drawer: {selected.drawer}
          </Chip>
        </div>
      )}
    </Section>
  )
}

function describeBinding(b: Binding): string {
  return `${b.codec} · ${b.surface} · ${b.compressor} · ${b.drawer}`
}
