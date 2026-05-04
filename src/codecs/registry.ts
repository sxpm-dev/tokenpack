import type { Codec } from './types'

const byId = new Map<number, Codec>()
const byName = new Map<string, Codec>()

export function registerCodec(codec: Codec): void {
  byId.set(codec.id, codec)
  byName.set(codec.name, codec)
}

export function getCodecById(id: number): Codec {
  const codec = byId.get(id)
  if (!codec) throw new Error(`Unknown codec id: ${id}`)
  return codec
}

export function getCodecByName(name: string): Codec {
  const codec = byName.get(name)
  if (!codec)
    throw new Error(`Unknown codec: "${name}". Run \`tokenpack list\` to see available codecs.`)
  return codec
}

export function listCodecs(): Codec[] {
  return [...byId.values()]
}
