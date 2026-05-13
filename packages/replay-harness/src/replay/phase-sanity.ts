import { mkdir } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import type { Page } from 'playwright'

import type { BrowserConsoleMessage, PhaseSanity } from '../report/types.js'

export interface PhaseSanityOptions {
  screenshotDir?: string
  screenshotPrefix?: string
}

export interface PhaseDiagnostics {
  consoleMessages: BrowserConsoleMessage[]
  consoleErrors: string[]
  pageErrors: string[]
}

const MAX_DIAGNOSTIC_MESSAGES = 20
const MAX_CONSOLE_MESSAGES = 500
const BODY_SAMPLE_LENGTH = 500

export function pushDiagnostic(target: string[], text: string): void {
  if (target.length >= MAX_DIAGNOSTIC_MESSAGES) return
  target.push(text.slice(0, 1000))
}

export function pushConsoleMessage(target: BrowserConsoleMessage[], message: BrowserConsoleMessage): void {
  if (target.length >= MAX_CONSOLE_MESSAGES) return
  target.push({ type: message.type, text: message.text.slice(0, 2000) })
}

export async function capturePhaseSanity(
  page: Page,
  options: PhaseSanityOptions | undefined,
  kind: 'cold' | 'reload',
  diagnostics: PhaseDiagnostics,
): Promise<PhaseSanity> {
  const sanity: PhaseSanity = {
    finalUrl: page.url(),
    consoleMessages: diagnostics.consoleMessages,
    consoleErrors: diagnostics.consoleErrors,
    pageErrors: diagnostics.pageErrors,
  }

  try {
    sanity.title = await page.title()
  } catch {
    // ignored
  }

  try {
    sanity.bodyTextSample = await page
      .locator('body')
      .innerText({ timeout: 1000 })
      .then(text => text.replace(/\s+/g, ' ').trim().slice(0, BODY_SAMPLE_LENGTH))
  } catch {
    // ignored
  }

  if (options?.screenshotDir) {
    await mkdir(options.screenshotDir, { recursive: true })
    const prefix = options.screenshotPrefix ? sanitizeFilePart(options.screenshotPrefix) : 'phase'
    const fileName = `${prefix}-${kind}.png`
    const screenshotPath = join(options.screenshotDir, fileName)

    await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => undefined)
    sanity.screenshotPath = screenshotPath
  }

  return sanity
}

export function relativeScreenshotPath(reportPath: string, screenshotPath: string): string {
  const reportDir = dirname(reportPath)
  const screenshotDir = dirname(screenshotPath)

  if (screenshotDir === reportDir) return basename(screenshotPath)
  if (screenshotDir.startsWith(`${reportDir}/`)) return screenshotPath.slice(reportDir.length + 1)

  return screenshotPath
}

function sanitizeFilePart(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '')
}
