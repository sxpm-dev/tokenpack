// Simplified routing planner — mirrors the constants from
// packages/core/src/router/plan.ts so the visualization stays accurate.

export interface FileInput {
  id: string
  path: string
  bytes: number
}

export interface Segment {
  chunkId: number
  offsetInChunk: number
  length: number
  fileOffset: number
}

export interface PlannedFile {
  id: string
  path: string
  bytes: number
  segments: Segment[]
}

export interface PlannedChunk {
  id: number
  size: number
  occupants: { fileId: string; offset: number; length: number }[]
}

export interface PlanResult {
  files: PlannedFile[]
  chunks: PlannedChunk[]
  manifest: object
}

export const TARGET_CHUNK_BYTES = 1_048_576 // 1 MB
export const SPLIT_THRESHOLD = 524_288 // 512 KB
export const TINY_THRESHOLD = 32_768 // 32 KB

export function planRouter(input: FileInput[]): PlanResult {
  const files: PlannedFile[] = input.map(f => ({
    id: f.id,
    path: f.path,
    bytes: f.bytes,
    segments: [],
  }))

  const chunks: PlannedChunk[] = []
  let nextChunkId = 0

  // Group: big files (>=SPLIT_THRESHOLD), medium files, tiny files
  const big = files.filter(f => f.bytes >= SPLIT_THRESHOLD)
  const medium = files.filter(f => f.bytes < SPLIT_THRESHOLD && f.bytes >= TINY_THRESHOLD)
  const tiny = files
    .filter(f => f.bytes < TINY_THRESHOLD)
    .sort((a, b) => a.path.localeCompare(b.path))

  // Big files: split into TARGET_CHUNK_BYTES pieces
  for (const file of big) {
    let remaining = file.bytes
    let fileOffset = 0

    while (remaining > 0) {
      const take = Math.min(remaining, TARGET_CHUNK_BYTES)
      const chunkId = nextChunkId++

      chunks.push({
        id: chunkId,
        size: take,
        occupants: [{ fileId: file.id, offset: 0, length: take }],
      })
      file.segments.push({ chunkId, offsetInChunk: 0, length: take, fileOffset })
      fileOffset += take
      remaining -= take
    }
  }

  // Medium files: each gets its own chunk (but may pack with tiny files if room)
  for (const file of medium) {
    const chunkId = nextChunkId++

    chunks.push({
      id: chunkId,
      size: file.bytes,
      occupants: [{ fileId: file.id, offset: 0, length: file.bytes }],
    })
    file.segments.push({ chunkId, offsetInChunk: 0, length: file.bytes, fileOffset: 0 })
  }

  // Tiny files: pack contiguously, ~TARGET_CHUNK_BYTES per chunk
  let cursor = 0
  let currentChunk: PlannedChunk | null = null

  for (const file of tiny) {
    if (!currentChunk || cursor + file.bytes > TARGET_CHUNK_BYTES) {
      currentChunk = {
        id: nextChunkId++,
        size: 0,
        occupants: [],
      }
      chunks.push(currentChunk)
      cursor = 0
    }
    currentChunk.occupants.push({ fileId: file.id, offset: cursor, length: file.bytes })
    file.segments.push({
      chunkId: currentChunk.id,
      offsetInChunk: cursor,
      length: file.bytes,
      fileOffset: 0,
    })
    cursor += file.bytes
    currentChunk.size = cursor
  }

  const manifest = {
    files: files.map(f => ({
      path: f.path,
      byteLength: f.bytes,
      segments: f.segments.map(s => ({
        chunkId: s.chunkId,
        offset: s.offsetInChunk,
        length: s.length,
        fileOffset: s.fileOffset,
      })),
    })),
  }

  return { files, chunks, manifest }
}
