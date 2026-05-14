import { describe, expect, it } from 'vitest'

import { planRouterLoad, type RouterChunkRef, type RouterFileRef } from '../src/router-load-plan'

describe('router load planner', () => {
  it('coalesces tiny-file bursts more aggressively than normal ranges', () => {
    const chunk: RouterChunkRef = {
      id: 'tiny',
      href: 'tiny.png',
      byteLength: 8 * 1024 * 1024,
      payloadOffset: 128,
    }
    const files = Array.from({ length: 8 }, (_, index): RouterFileRef => {
      const length = 4 * 1024

      return {
        url: `https://example.test/tiny-${index}.js`,
        path: `tiny-${index}.js`,
        status: 200,
        headers: {},
        byteLength: length,
        compressedByteLength: length,
        segments: [
          {
            chunkId: chunk.id,
            offset: index * 512 * 1024,
            length,
            fileOffset: 0,
          },
        ],
      }
    })

    const plan = planRouterLoad(files, new Map([[chunk.id, chunk]]), {
      allFiles: [
        ...files,
        { ...files[0]!, url: 'https://example.test/extra.js', path: 'extra.js' },
      ],
      mode: 'stream',
      strategy: 'auto',
    })

    expect(plan).toMatchObject({
      kind: 'merged-ranges',
      reason: 'tiny-file-burst-coalesced',
      estimate: {
        requestCount: 4,
        chunkCount: 1,
        segmentCount: 8,
      },
    })
    if (plan.kind !== 'merged-ranges') throw new Error('expected merged ranges')
    expect(plan.ranges).toHaveLength(4)
  })

  it('keeps small non-burst selections on buffered ranges', () => {
    const chunk: RouterChunkRef = {
      id: 'tiny',
      href: 'tiny.png',
      byteLength: 1024 * 1024,
      payloadOffset: 128,
    }
    const files = Array.from({ length: 2 }, (_, index): RouterFileRef => {
      const length = 4 * 1024

      return {
        url: `https://example.test/tiny-${index}.js`,
        path: `tiny-${index}.js`,
        status: 200,
        headers: {},
        byteLength: length,
        compressedByteLength: length,
        segments: [
          {
            chunkId: chunk.id,
            offset: index * 64 * 1024,
            length,
            fileOffset: 0,
          },
        ],
      }
    })

    const plan = planRouterLoad(files, new Map([[chunk.id, chunk]]), {
      allFiles: [
        ...files,
        { ...files[0]!, url: 'https://example.test/extra.js', path: 'extra.js' },
      ],
      mode: 'stream',
      strategy: 'auto',
    })

    expect(plan).toMatchObject({
      kind: 'single-merged',
      mode: 'buffered',
      reason: 'small-selection-range-fetch',
      estimate: {
        requestCount: 1,
        chunkCount: 1,
        segmentCount: 2,
      },
    })
  })

  it('prefers whole-chunk streaming for large files with modest over-fetch', () => {
    const chunk: RouterChunkRef = {
      id: 'large',
      href: 'large.png',
      byteLength: 1024 * 1024,
      payloadOffset: 128,
    }
    const file: RouterFileRef = {
      url: 'https://example.test/app.js',
      path: 'app.js',
      status: 200,
      headers: {},
      byteLength: 700 * 1024,
      compressedByteLength: 700 * 1024,
      segments: [
        {
          chunkId: chunk.id,
          offset: 64 * 1024,
          length: 700 * 1024,
          fileOffset: 0,
        },
      ],
    }

    const plan = planRouterLoad([file], new Map([[chunk.id, chunk]]), {
      allFiles: [
        file,
        { ...file, url: 'https://example.test/extra.js', path: 'extra.js', byteLength: 1 },
      ],
      mode: 'stream',
      strategy: 'auto',
    })

    expect(plan).toMatchObject({
      kind: 'whole-chunks',
      mode: 'stream',
      reason: 'large-file-whole-chunk-stream',
      estimate: {
        requestCount: 1,
        chunkCount: 1,
      },
    })
  })

  it('does not apply large-file streaming bias in buffered mode', () => {
    const chunk: RouterChunkRef = {
      id: 'large',
      href: 'large.png',
      byteLength: 1024 * 1024,
      payloadOffset: 128,
    }
    const file: RouterFileRef = {
      url: 'https://example.test/app.js',
      path: 'app.js',
      status: 200,
      headers: {},
      byteLength: 700 * 1024,
      compressedByteLength: 700 * 1024,
      segments: [
        {
          chunkId: chunk.id,
          offset: 64 * 1024,
          length: 700 * 1024,
          fileOffset: 0,
        },
      ],
    }

    const plan = planRouterLoad([file], new Map([[chunk.id, chunk]]), {
      allFiles: [
        file,
        { ...file, url: 'https://example.test/extra.js', path: 'extra.js', byteLength: 1 },
      ],
      mode: 'buffered',
      strategy: 'auto',
    })

    expect(plan).toMatchObject({
      kind: 'parallel-segments',
      mode: 'buffered',
      reason: 'range-segments',
      estimate: {
        requestCount: 1,
        chunkCount: 1,
        segmentCount: 1,
      },
    })
  })

  it('coalesces hot chunk range fanout under the per-chunk cap in auto mode', () => {
    const chunk: RouterChunkRef = {
      id: 'hot',
      href: 'hot.png',
      byteLength: 16 * 1024 * 1024,
      payloadOffset: 128,
    }
    const files = Array.from({ length: 16 }, (_, index): RouterFileRef => {
      const length = 64 * 1024

      return {
        url: `https://example.test/file-${index}.js`,
        path: `file-${index}.js`,
        status: 200,
        headers: {},
        byteLength: length,
        compressedByteLength: length,
        segments: [
          {
            chunkId: chunk.id,
            offset: index * 512 * 1024,
            length,
            fileOffset: 0,
          },
        ],
      }
    })
    const allFiles = [
      ...files,
      {
        url: 'https://example.test/extra.js',
        path: 'extra.js',
        status: 200,
        headers: {},
        byteLength: 1,
        compressedByteLength: 1,
        segments: [{ chunkId: chunk.id, offset: chunk.byteLength - 1, length: 1, fileOffset: 0 }],
      },
    ]

    const plan = planRouterLoad(files, new Map([[chunk.id, chunk]]), {
      allFiles,
      mode: 'stream',
      strategy: 'auto',
      rangeRequestPenaltyBytes: 512 * 1024,
    })

    expect(plan).toMatchObject({
      kind: 'merged-ranges',
      reason: 'hot-chunk-range-coalesced',
      estimate: {
        requestCount: 8,
        chunkCount: 1,
        segmentCount: 16,
      },
    })
    if (plan.kind !== 'merged-ranges') throw new Error('expected merged ranges')
    expect(plan.ranges).toHaveLength(8)
    expect(plan.ranges.every(range => range.segments.length === 2)).toBe(true)
  })

  it('keeps explicit range strategy as real segment ranges', () => {
    const chunk: RouterChunkRef = {
      id: 'hot',
      href: 'hot.png',
      byteLength: 8 * 1024 * 1024,
      payloadOffset: 128,
    }
    const files = Array.from({ length: 16 }, (_, index): RouterFileRef => {
      const length = 64 * 1024

      return {
        url: `https://example.test/file-${index}.js`,
        path: `file-${index}.js`,
        status: 200,
        headers: {},
        byteLength: length,
        compressedByteLength: length,
        segments: [
          {
            chunkId: chunk.id,
            offset: index * 512 * 1024,
            length,
            fileOffset: 0,
          },
        ],
      }
    })

    const plan = planRouterLoad(files, new Map([[chunk.id, chunk]]), {
      allFiles: [...files, { ...files[0]!, url: 'https://example.test/extra.js', path: 'extra.js' }],
      mode: 'stream',
      strategy: 'range-stream',
    })

    expect(plan).toMatchObject({
      kind: 'parallel-segments',
      reason: 'forced-segments',
      estimate: {
        requestCount: 16,
        chunkCount: 1,
        segmentCount: 16,
      },
    })
  })
})
