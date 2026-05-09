import type { TargetConfig } from '../types.js'

export const publicDemo: TargetConfig = {
  id: 'public-demo',
  url: 'https://playwright.dev',
  journey: { type: 'goto-only' },
  authMode: 'none',
  captureGraceMs: 2000,
}
