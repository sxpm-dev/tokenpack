import type { Codec } from './types.js'
import { linearCodec } from './linear.js'

const byId = new Map<number, Codec>([[linearCodec.id, linearCodec]])
const byName = new Map<string, Codec>([[linearCodec.name, linearCodec]])

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
  if (!codec) throw new Error(`Unknown codec: "${name}". Run \`codeart list\` to see available codecs.`)
  return codec
}

export function listCodecs(): Codec[] {
  return [...byId.values()]
}
