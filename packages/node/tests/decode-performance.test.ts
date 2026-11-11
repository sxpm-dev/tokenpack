import { expect, it, vi } from 'vitest'

import { decode, encode } from '../src'
import { PngSurface } from '../src/surfaces/png'

it('reuses pixels from detection instead of decoding the PNG twice', async () => {
  const source = Buffer.from('surface reuse '.repeat(1000))
  const token = await encode(source, { algo: 'linear-deflate' })
  const read = vi.spyOn(PngSurface.prototype, 'readBuffer')

  try {
    const pack = await decode(token)

    if (pack.isPack() || pack.isDiff()) throw new Error('expected file')
    expect(Buffer.from(await pack.content())).toEqual(source)
    expect(read).toHaveBeenCalledTimes(1)
  } finally {
    read.mockRestore()
  }
})

it('shares routed file decoding across single, array and stream access and retries failures', async () => {
  const { mkdtemp, writeFile, rm } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { decodeRouter, TokenPack } = await import('../src')
  const { DeflateCompressor } = await import('../src/compressors/deflate-compressor')
  const dir = await mkdtemp(join(tmpdir(), 'tokenpack-router-reuse-'))
  const text = 'repeated routed data '.repeat(1000)
  const artifacts = await encode(
    new TokenPack()
      .withFile('file.txt', text)
      .router({ chunkLayout: 'source-order', fileCompressor: 'deflate-6' }),
  )
  let spy: ReturnType<typeof vi.spyOn> | undefined

  try {
    for (const artifact of artifacts)
      await writeFile(
        join(dir, artifact.filename),
        new Uint8Array(await artifact.blob.arrayBuffer()),
      )
    const pack = await decodeRouter(join(dir, 'router.png'))

    if (!pack.isRouter()) throw new Error('expected router')
    expect(await pack.text('file.txt')).toBe(text)
    spy = vi.spyOn(DeflateCompressor.prototype, 'decompress')
    const [array, streamed] = await Promise.all([
      pack.text(['file.txt']),
      pack.stream.text(['file.txt']),
    ])

    expect([...array.values()]).toEqual([text])
    expect([...streamed.values()]).toEqual([text])
    expect(spy).not.toHaveBeenCalled()
    const retry = await decodeRouter(join(dir, 'router.png'))

    if (!retry.isRouter()) throw new Error('expected router')
    spy.mockRejectedValueOnce(new Error('transient decode failure'))
    await expect(retry.text('file.txt')).rejects.toThrow('transient decode failure')
    expect(await retry.text('file.txt')).toBe(text)
  } finally {
    spy?.mockRestore()
    await rm(dir, { recursive: true, force: true })
  }
})
