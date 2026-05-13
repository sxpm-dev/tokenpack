import type { Page } from 'playwright'

import type { JourneyConfig } from '../config/types.js'

export async function runJourney(page: Page, journey: JourneyConfig): Promise<void> {
  switch (journey.type) {
    case 'goto-only':
      return

    case 'login-and-open': {
      const { selectors } = journey

      await page.fill(selectors.email, process.env.LOGIN_EMAIL ?? '')
      await page.fill(selectors.password, process.env.LOGIN_PASSWORD ?? '')
      await page.click(selectors.submit)
      await page.waitForSelector(selectors.readyAfterLogin)

      return
    }

    case 'custom': {
      const mod = (await import(journey.modulePath)) as { default: (page: Page) => Promise<void> }

      await mod.default(page)

      return
    }
  }
}
