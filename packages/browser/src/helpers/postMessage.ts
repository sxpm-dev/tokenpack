// postMessage transport for TokenPack payloads.
//
// Sender:
//   sendPack(targetWindow, '{"big":"payload"}')
//
// Receiver:
//   onPack(window, data => console.log('got', data))
//
// Why TokenPack via postMessage? In some setups (cross-extension, sandboxed
// iframes with structured-clone budget), shipping a compressed binary blob
// is smaller than a structured-cloned JSON string. The catch: both ends must
// run @tokenpack/browser to encode/decode.

import { encode, type EncodeBrowserOptions } from '../encode'
import { decode } from '../decode'

const MESSAGE_KIND = '@tokenpack/pack'

interface TokenpackMessage {
  __kind: typeof MESSAGE_KIND
  pngBytes: ArrayBuffer
  options?: { key?: string }
}

export interface SendPackOptions extends EncodeBrowserOptions {
  /** Used by `transfer` to zero-copy the buffer when supported. */
  transfer?: boolean
}

export async function sendPack(
  target: Window | MessagePort | ServiceWorker | Worker,
  content: string | Uint8Array | ArrayBuffer | Blob,
  options: SendPackOptions = {},
): Promise<void> {
  const result = await encode(content, options)
  const arrayBuffer = await result.blobs[0].arrayBuffer()
  const message: TokenpackMessage = {
    __kind: MESSAGE_KIND,
    pngBytes: arrayBuffer,
    options: options.key ? { key: options.key } : undefined,
  }

  if (options.transfer && 'postMessage' in target) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(target as any).postMessage(message, [arrayBuffer])
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(target as any).postMessage(message)
  }
}

export type PackHandler = (data: Uint8Array, event: MessageEvent) => void | Promise<void>

/**
 * Listen for `@tokenpack/pack` messages on a target. Returns a cleanup function.
 *
 * Non-tokenpack messages are ignored. `key` decryption keys are sent inside
 * the message (NOT recommended for security-sensitive flows — use a side channel).
 */
export function onPack(
  target: Window | MessagePort | ServiceWorker | Worker | typeof globalThis,
  handler: PackHandler,
): () => void {
  async function listener(event: MessageEvent) {
    const data = event.data as TokenpackMessage | undefined

    if (!data || data.__kind !== MESSAGE_KIND) return
    try {
      const decoded = await decode(data.pngBytes, { key: data.options?.key })

      await handler(decoded, event)
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error('[@tokenpack/browser/postMessage] decode failed:', e)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(target as any).addEventListener('message', listener)

  return () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(target as any).removeEventListener('message', listener)
  }
}
