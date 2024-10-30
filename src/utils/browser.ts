import { Browser, BrowserContext, chromium, devices } from 'playwright-core'
import { findChrome } from './find-chrome'

let browser: Browser | undefined
let context: BrowserContext | undefined

export const getBrowserContext = async ({
  chromiumPath,
  profilePath,
  storageState,
}: {
  chromiumPath?: string
  profilePath?: string
  storageState?: string
} = {}) => {
  if (context) return context

  browser = await chromium.launch({
    args: ['--no-sandbox'],
    executablePath: chromiumPath || findChrome(),
    headless: false,
    slowMo: 100,
  })
  context = await browser.newContext({
    ...devices['iPhone 12'],
    storageState,
  })

  return context
}

export const destroyBrowser = async () => {
  if (browser && context) {
    await context.close()
    await browser.close()
    browser = undefined
    context = undefined
  }
}
