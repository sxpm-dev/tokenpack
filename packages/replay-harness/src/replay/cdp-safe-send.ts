import type { CDPSession } from 'playwright'

/**
 * Send a CDP message but swallow Invalid-InterceptionId / target-closed errors,
 * which are normal when navigation invalidates a paused request. Without this,
 * in-flight async handlers crash the runner when the page reloads or closes.
 */
export async function safeSend(
  client: CDPSession,
  method: 'Fetch.continueRequest' | 'Fetch.fulfillRequest',
  params: object,
): Promise<void> {
  try {
    await (client.send as (m: string, p: object) => Promise<unknown>)(method, params)
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err)

    if (
      !m.includes('Invalid InterceptionId') &&
      !m.includes('Target page, context or browser has been closed')
    ) {
      throw err
    }
  }
}
