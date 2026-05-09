/** Navigation timeout for `page.goto` and `page.reload`. */
export const NAV_TIMEOUT_MS = 120_000

/**
 * Fixed grace window after `load` event + journey, in lieu of waitForNetworkidle.
 * Chatty SPAs (Wix editor, Gmail-like apps) never go idle — websockets and
 * telemetry pings prevent the 500ms-no-requests condition. A fixed grace
 * gives a comparable wall-clock measurement across all modes.
 */
export const POST_LOAD_GRACE_MS = 500

/**
 * Chromium feature flags to enable cross-origin → loopback fetches (PNA).
 * Required so the browser-side bootstrap can fetch from `127.0.0.1` in `--local`
 * mode. Same flags applied to all interception modes for parity.
 */
export const CHROMIUM_LAUNCH_ARGS: ReadonlyArray<string> = [
  '--disable-features=BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,LocalNetworkAccessChecks',
]
