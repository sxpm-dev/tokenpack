// Shared Huffman utilities: frequency analysis, canonical code construction, and decode tables.

// ─── Heap helpers ─────────────────────────────────────────────────────────────

interface HeapNode {
  freq: number
  symbol: number // -1 for internal nodes
  left: HeapNode | null
  right: HeapNode | null
}

function heapPush(heap: HeapNode[], node: HeapNode): void {
  heap.push(node)
  let i = heap.length - 1
  while (i > 0) {
    const parent = (i - 1) >> 1
    if (heap[parent].freq <= heap[i].freq) break
    const tmp = heap[parent]
    heap[parent] = heap[i]
    heap[i] = tmp
    i = parent
  }
}

function heapPop(heap: HeapNode[]): HeapNode {
  const top = heap[0]
  const last = heap.pop()!
  if (heap.length > 0) {
    heap[0] = last
    let i = 0
    while (true) {
      const l = 2 * i + 1
      const r = 2 * i + 2
      let smallest = i
      if (l < heap.length && heap[l].freq < heap[smallest].freq) smallest = l
      if (r < heap.length && heap[r].freq < heap[smallest].freq) smallest = r
      if (smallest === i) break
      const tmp = heap[i]
      heap[i] = heap[smallest]
      heap[smallest] = tmp
      i = smallest
    }
  }
  return top
}

// ─── Code length derivation ───────────────────────────────────────────────────

function assignLengths(node: HeapNode, depth: number, lengths: Uint8Array): void {
  if (node.symbol >= 0) {
    lengths[node.symbol] = depth
    return
  }
  if (node.left) assignLengths(node.left, depth + 1, lengths)
  if (node.right) assignLengths(node.right, depth + 1, lengths)
}

// Limit code lengths to maxBits using the standard package-merge-inspired approach:
// iteratively merge the two longest codes until all ≤ maxBits.
function limitLengths(lengths: Uint8Array, maxBits: number): void {
  // Collect active symbols
  let changed = true
  while (changed) {
    changed = false
    let maxLen = 0
    for (let i = 0; i < 256; i++) if (lengths[i] > maxLen) maxLen = lengths[i]
    if (maxLen <= maxBits) break
    // Find two symbols with maxLen and reduce them: their parent stays at maxLen-1
    const victims: number[] = []
    for (let i = 0; i < 256 && victims.length < 2; i++) {
      if (lengths[i] === maxLen) victims.push(i)
    }
    if (victims.length === 2) {
      lengths[victims[0]] = maxLen - 1
      lengths[victims[1]] = maxLen - 1
      // Compensate: find a symbol with maxLen-1 and increase to maxLen
      // (we just made room for one more code at maxLen-1 by merging two at maxLen)
      // Actually the standard approach: increase a shorter code to absorb the "credit"
      // For simplicity: find symbol with smallest length (but >0) and mark it longer
      let minLen = maxBits
      let minSym = -1
      for (let i = 0; i < 256; i++) {
        if (lengths[i] > 0 && lengths[i] < minLen && i !== victims[0] && i !== victims[1]) {
          minLen = lengths[i]
          minSym = i
        }
      }
      if (minSym >= 0) {
        lengths[minSym] = minLen + 1
      }
      changed = true
    } else if (victims.length === 1) {
      // Can only happen with a single symbol; force to 1
      lengths[victims[0]] = 1
      changed = true
    } else {
      break
    }
  }
}

/**
 * Build optimal Canonical Huffman code lengths from byte frequencies.
 * Returns 256 code lengths (0 = unused symbol).
 */
export function buildCodeLengths(freq: Uint32Array): Uint8Array {
  const lengths = new Uint8Array(256)

  // Collect symbols with nonzero frequency
  const active: number[] = []
  for (let i = 0; i < 256; i++) if (freq[i] > 0) active.push(i)

  if (active.length === 0) return lengths

  if (active.length === 1) {
    // Special case: only one symbol → assign length 1
    lengths[active[0]] = 1
    return lengths
  }

  // Build Huffman tree via min-heap
  const heap: HeapNode[] = []
  for (const sym of active) {
    heapPush(heap, { freq: freq[sym], symbol: sym, left: null, right: null })
  }

  while (heap.length > 1) {
    const a = heapPop(heap)
    const b = heapPop(heap)
    heapPush(heap, { freq: a.freq + b.freq, symbol: -1, left: a, right: b })
  }

  assignLengths(heap[0], 0, lengths)
  limitLengths(lengths, 15) // keep codes within 15 bits for safety
  return lengths
}

/**
 * Serialize code lengths: 256 bytes (one per symbol, values 0–16).
 */
export function serializeLengths(lengths: Uint8Array): Buffer {
  return Buffer.from(lengths)
}

/**
 * Deserialize code lengths from 256 bytes.
 */
export function deserializeLengths(data: Buffer): Uint8Array {
  const lengths = new Uint8Array(256)
  const count = Math.min(data.length, 256)
  for (let i = 0; i < count; i++) lengths[i] = data[i]
  return lengths
}

/**
 * Assign canonical Huffman codes.
 * Symbols sorted by (length ASC, symbol ASC), codes assigned in order.
 * Returns array of { symbol, code, length } sorted as above.
 */
export function assignCodes(lengths: Uint8Array): { symbol: number; code: number; length: number }[] {
  // Gather symbols with nonzero lengths
  const symbols: { symbol: number; length: number }[] = []
  for (let i = 0; i < 256; i++) {
    if (lengths[i] > 0) symbols.push({ symbol: i, length: lengths[i] })
  }
  // Sort by length ASC, then symbol ASC
  symbols.sort((a, b) => a.length - b.length || a.symbol - b.symbol)

  // Assign canonical codes
  const result: { symbol: number; code: number; length: number }[] = []
  let code = 0
  let prevLen = 0
  for (const { symbol, length } of symbols) {
    if (length > prevLen) {
      code <<= length - prevLen
      prevLen = length
    }
    result.push({ symbol, code, length })
    code++
  }
  return result
}

/**
 * Build decode table from code lengths.
 * Returns a Map from (code << (16-len)) to { symbol, length } for fast bit-by-bit decode.
 * Uses a flat array keyed by top-16-bits for O(1) lookup.
 */
export function buildDecodeTable(
  lengths: Uint8Array,
): { table: Int32Array; maxLen: number } {
  const entries = assignCodes(lengths)
  if (entries.length === 0) return { table: new Int32Array(0), maxLen: 0 }

  let maxLen = 0
  for (const e of entries) if (e.length > maxLen) maxLen = e.length

  // table[code_left_aligned_to_maxLen] = symbol (or -1 if unused)
  const tableSize = 1 << maxLen
  const table = new Int32Array(tableSize).fill(-1)

  for (const { symbol, code, length } of entries) {
    // Fill all entries that start with this code
    const shift = maxLen - length
    const base = code << shift
    const count = 1 << shift
    for (let j = 0; j < count; j++) {
      table[base + j] = symbol | (length << 16)
    }
  }

  return { table, maxLen }
}
