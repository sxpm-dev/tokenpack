import { createWriteStream, mkdirSync, type WriteStream } from 'node:fs'
import { dirname } from 'node:path'

export function installRunLog(path: string): () => void {
  mkdirSync(dirname(path), { recursive: true })
  const log = createWriteStream(path, { flags: 'a' })
  const restoreStdout = teeWrite(process.stdout, log)
  const restoreStderr = teeWrite(process.stderr, log)

  return () => {
    restoreStdout()
    restoreStderr()
    log.end()
  }
}

function teeWrite(stream: NodeJS.WriteStream, log: WriteStream): () => void {
  const originalWrite = stream.write.bind(stream) as NodeJS.WriteStream['write']

  stream.write = ((chunk: unknown, encoding?: unknown, cb?: unknown) => {
    if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
      log.write(chunk)
    }

    return originalWrite(
      chunk as string | Uint8Array,
      encoding as BufferEncoding,
      cb as ((err?: Error | null) => void) | undefined,
    )
  }) as NodeJS.WriteStream['write']

  return () => {
    stream.write = originalWrite
  }
}
