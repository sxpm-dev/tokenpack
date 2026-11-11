import { encode } from '@tokenpack/node'
import { expect, it, vi } from 'vitest'

import { decodeStreamingPng } from '../src/surfaces/streaming-png-decoder'

function source(bytes: Uint8Array, chunkSize: number) {
  let offset = 0

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset === bytes.length) return controller.close()
      controller.enqueue(bytes.subarray(offset, offset + chunkSize))
      offset = Math.min(bytes.length, offset + chunkSize)
    },
  })
}

it('delivers fragmented PNG rows without timer polling', async () => {
  const png = await encode(Buffer.from('fragmented streaming '.repeat(1000)), {
    algo: 'linear-stream-deflate',
  })
  const timer = vi.spyOn(globalThis, 'setTimeout')

  try {
    const handle = await decodeStreamingPng(source(png, 13))
    const rows = []

    for await (const row of handle.rows) rows.push(row)
    expect(rows).toHaveLength(handle.height)
    expect(rows.every(row => row.length === handle.width * handle.fileChannels)).toBe(true)
    expect(timer).not.toHaveBeenCalled()
  } finally {
    timer.mockRestore()
  }
})

it('rejects a truncated PNG rather than returning partial success', async () => {
  const png = await encode(Buffer.from('truncated'), { algo: 'linear-stream-deflate' })
  const handle = await decodeStreamingPng(source(png.subarray(0, png.length - 12), 17))

  await expect(
    (async () => {
      for await (const row of handle.rows) void row
    })(),
  ).rejects.toThrow(/truncated|IEND/)
})

it('propagates a transport error after the header without hanging', async () => {
  const png = await encode(Buffer.from('transport error'), { algo: 'linear-stream-deflate' })
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const input = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c
      c.enqueue(png.subarray(0, 33))
    },
  })
  const handle = await decodeStreamingPng(input)
  const pending = (async () => {
    for await (const row of handle.rows) void row
  })()

  controller.error(new Error('transport failed'))
  await expect(pending).rejects.toThrow('transport failed')
})

it('drains rows produced while a slow consumer yields', async () => {
  const { randomBytes } = await import('node:crypto')
  const png = await encode(randomBytes(100000), { algo: 'linear-stream-deflate' })
  const handle = await decodeStreamingPng(source(png, 257))
  let count = 0

  for await (const row of handle.rows) {
    expect(row.length).toBe(handle.width * handle.fileChannels)
    if (count++ === 0) await new Promise(resolve => setTimeout(resolve, 20))
  }
  expect(count).toBe(handle.height)
})
