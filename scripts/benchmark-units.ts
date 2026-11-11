import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { encode, decode } from '@tokenpack/node'
import {
  insertTpakChunk,
  extractTpakChunk,
} from '../packages/node/src/algorithms/pixel-range-png-base'
import {
  insertTpakChunk as browserInsert,
  extractTpakChunk as browserExtract,
} from '../packages/browser/src/algorithms/pixel-range-png-base'

// Browser byte-processing units run under Node. Canvas and network timing are excluded.
const rows: object[] = []
async function measure(name: string, bytes: number, operation: () => unknown | Promise<unknown>) {
  for (let i = 0; i < 3; i++) await operation()
  const samples: number[] = []
  for (let i = 0; i < 30; i++) {
    const start = performance.now()
    await operation()
    samples.push(performance.now() - start)
  }
  const sorted = [...samples].sort((a, b) => a - b)
  const median = (sorted[14] + sorted[15]) / 2
  rows.push({ name, bytes, medianMs: median, p95Ms: sorted[28], samples })
  console.log(
    `${name} ${bytes} bytes: median ${median.toFixed(3)} ms, p95 ${sorted[28].toFixed(3)} ms`,
  )
}
for (const size of [65536, 1048576]) {
  const input = Buffer.alloc(size)
  for (let i = 0; i < size; i++) input[i] = (i * 31 + (i >>> 8)) & 255
  const token = await encode(input, { algo: 'pixel-range-none' })
  for (const [environment, insert, extract] of [
    ['node', insertTpakChunk, extractTpakChunk],
    ['browser', browserInsert, browserExtract],
  ] as const) {
    const artifact = insert(token, input)
    assert.deepEqual(Buffer.from(extract(artifact)), input)
    await measure(`${environment}/tpak-insert`, size, () => insert(token, input))
    await measure(`${environment}/tpak-extract`, size, () => extract(artifact))
  }
  for (const algo of ['pixel-range-none', 'pixel-range-deflate', 'linear-deflate']) {
    const artifact = await encode(input, { algo })
    const pack = await decode(artifact)
    assert.ok('content' in pack)
    assert.deepEqual(Buffer.from(await pack.content()), input)
    await measure(`node/${algo}/encode`, size, () => encode(input, { algo }))
    await measure(`node/${algo}/decode`, size, async () => {
      const result = await decode(artifact)
      assert.ok('content' in result)
      await result.content()
    })
  }
}
if (process.argv[2])
  writeFileSync(
    process.argv[2],
    JSON.stringify(
      {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        warmup: 3,
        samples: 30,
        rows,
      },
      null,
      2,
    ) + '\n',
  )
