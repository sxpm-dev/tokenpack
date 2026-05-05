import fs from 'fs'
import { createTokenDecodeStream } from './src/stream-decoder'
import './src/algorithms/register-all'

async function test(tokenFile: string, sourceFile: string) {
  const original = fs.readFileSync(sourceFile)
  const chunks: Buffer[] = []
  let ttfb: number | null = null
  const t0 = performance.now()

  await new Promise<void>((resolve, reject) => {
    const decoder = createTokenDecodeStream()
    decoder.on('data', (c: Buffer) => {
      if (ttfb === null) ttfb = performance.now() - t0
      chunks.push(c)
    })
    decoder.on('end', resolve)
    decoder.on('error', reject)
    // Use small chunk size to simulate streaming
    const fileStream = fs.createReadStream(tokenFile, { highWaterMark: 8192 })
    fileStream.pipe(decoder)
  })

  const decoded = Buffer.concat(chunks)
  const ok = decoded.equals(original)
  const total = performance.now() - t0
  console.log(`${ok ? '✓' : '✗'} ttfb=${ttfb?.toFixed(1)}ms total=${total.toFixed(1)}ms decoded=${decoded.length}B expected=${original.length}B ${tokenFile.split('/').pop()}`)
}

test('benchmark/tokens/stream-png__react-dom-client.production.png', 'benchmark/sources/react-dom-client.production.js')
  .then(() => test('benchmark/tokens/stream-png__react-dom-client.development.png', 'benchmark/sources/react-dom-client.development.js'))
  .catch(console.error)
