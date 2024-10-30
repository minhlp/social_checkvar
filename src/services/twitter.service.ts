import { profileLinkPrompt } from '~/prompts/twitter.prompts'
import { destroyBrowser, getBrowserContext } from '~/utils/browser'
import { log } from '~/services'
import { chromeProfileDictPrompt } from '~/prompts/browser.prompts'
import { isFileExisted } from '~/utils/file'
import * as fs from 'fs'
import { ITwitterFollowerRecord, ITwitterProfile } from '~/interfaces/twitter.interface'
import { Page } from 'playwright-core'
import { readJsonFile } from '~/utils/read-json-file'
import { readCSVFile } from '~/utils/readCSVFile'
import { colorize } from '~/utils/colorize'
import { readTxtFile } from '~/utils/read-txt-file'
const storageStatePath = 'xcom-storage-state.json'
const loginInfoPath = 'xcom-login-info.txt'
// const fs = require('fs') // Import the File System module
export class TwitterService {
  async login(): Promise<any> {
    if (isFileExisted(loginInfoPath)) {
      // Raw file content simulation
      const [username, password] = await readTxtFile(loginInfoPath)
      const context = await getBrowserContext()

      // Step 2: Open a new page and go to X.com login page
      const page = await context.newPage()
      await page.goto('https://x.com/i/flow/login') // X.com login URL

      // Step 3: Perform login steps (adapt selectors for X.com if necessary)
      await page.fill('input[name="text"]', username)
      await page.press('input[name="text"]', 'Enter')

      // Wait for the page to navigate after submitting the username
      await page.waitForSelector('input[name="password"]') // Selector for the followers element

      // Step 4: Now, fill in the password
      await page.fill('input[name="password"]', password)
      await page.press('input[name="password"]', 'Enter')
      // await page.click('div[data-testid="LoginForm_Login_Button"]') // Adjust selector if necessary

      // Wait for navigation to complete after login
      await page.waitForURL('https://x.com/home', { timeout: 10000 }) // Wait for the homepage URL

      // Step 5: Save the storage state (cookies + local storage) to a JSON file
      await context.storageState({ path: storageStatePath })

      // Step 6: Close the browser
      await destroyBrowser()
    } else {
      log.error('Cant find xcom-login-info.txt')
    }
  }
  async loginWithCookie(): Promise<any> {
    // Raw file content simulation
    const fileContent = await readTxtFile('xcom-cookie.txt', (line: string) => {
      const [name, value, domain, path, expires, , httpOnly, secure, sameSite] = line.split(/\t+/)
      const cookieObject = {
        name,
        value,
        domain,
        path,
        expires: expires === 'Session' ? null : new Date(expires).getTime() / 1000, // Convert to Unix timestamp
        httpOnly: httpOnly === '✓',
        secure: secure === '✓',
        sameSite: sameSite === 'None' ? 'None' : sameSite || 'Lax', // Default to 'Lax' if missing
      }
      return cookieObject
    })

    // Convert content into an array of objects

    console.log(fileContent)
  }
  async getFollowers(): Promise<any> {
    if (isFileExisted(storageStatePath)) {
      const link = await profileLinkPrompt()
      const browserContext = await getBrowserContext({ storageState: storageStatePath })
      const page = await browserContext.newPage()
      // await page.goto(link)
      // await page.waitForLoadState('networkidle');  // Wait until network is idle (no more requests)
      // // // Wait for the page to load completely
      // await page.waitForSelector('a[href$="/verified_followers"] > span') // Selector for the followers element

      // const followerCount = await page.$eval(
      //   'a[href$="/verified_followers"] > span',
      //   (el) => el.textContent,
      // )
      // Get the full HTML content of the page
      // const html = await page.content()

      // Log the HTML content
      // console.log(html)
      // fs.writeFileSync('pageContent.html', html)

      // Get list followers
      // Navigate to the Twitter profile followers page

      await page.goto(`${link}/followers`) // Replace 'elonmusk' with the desired username
      log.info(`navigate to ${link}/followers`)
      await page.waitForLoadState('networkidle') // Wait for all network requests to finish
      log.info(`network requests finished`)

      // Wait for the followers list to load
      await page.waitForSelector('div[aria-label="Timeline: Followers"]')

      const uniqueFollowers: ITwitterFollowerRecord[] = []

      const seenProfiles = new Set()
      const collectData = async () => {
        // Extract follower information
        const followers = await this.collectFollowers(page)

        for (const follower of followers) {
          if (!seenProfiles.has(follower.profileLink)) {
            seenProfiles.add(follower.profileLink)
            uniqueFollowers.push(follower)
          }
        }
      }
      await collectData()
      let currentLoaded = 0
      // // Scroll and collect follower info, handling lazy-loading
      while (currentLoaded < uniqueFollowers.length) {
        currentLoaded = uniqueFollowers.length
        // Get the current scroll height

        // Scroll down the page to load more followers
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight)
        })
        await page.waitForTimeout(3000) // Wait for new followers to load
        // Scroll down and collect followers
        await collectData()
        log.success(`${uniqueFollowers.length} rows loaded`)
      }

      // while (true) {
      //   // Get the current scroll height
      //   previousHeight = await page.evaluate('document.body.scrollHeight')

      //   // Scroll down the page to load more followers
      //   // eslint-disable-next-line @typescript-eslint/no-loop-func
      //   await page.evaluate(() => {
      //     window.scrollBy(0, window.innerHeight)
      //   })
      //   await page.waitForTimeout(2000) // Wait for new followers to load

      //   // Extract followers currently visible on the page
      //   // eslint-disable-next-line @typescript-eslint/no-loop-func
      //   const newFollowers = await page.evaluate(async () => {
      //     const followerElements = page.locator('div[data-testid="UserCell"]')
      //     const followerData: { name?: string; profileURL?: string; isFollowing?: boolean }[] = []
      //     const count = await followerElements.count()
      //     for (let i = 0; i < count; i++) {
      //       const follower = followerElements.nth(i) // Select the nth follower element
      //       const aTag = await follower.locator('a[role="link"]')
      //       log.success(`aTag ${aTag}`)
      //       // Use locators to extract the follower's name, profile URL, and following status
      //       const name = await aTag.innerText() // Get the follower's name
      //       const profileURL = (await aTag.getAttribute('href')) || '' // Get the profile URL
      //       const isFollowing = (await follower.locator('div[aria-label="Following"]').count()) > 0 // Check if following

      //       followers.push({ name, profileURL, isFollowing }) // Add follower info to the array
      //     }

      //     return followerData
      //   })

      //   // Add new followers to the list
      //   followers = [...followers, ...newFollowers]

      //   // Check if more content is loading by comparing scroll heights
      //   currentHeight = await page.evaluate('document.body.scrollHeight')

      //   // Break the loop if no more content is loading (lazy-loading stops)
      //   if (currentHeight === previousHeight) {
      //     break
      //   }
      // }
      const profile: ITwitterProfile = {
        followers: uniqueFollowers.length,
        verifiedFollowers: uniqueFollowers.filter((item) => item.isVerifiedAccount).length,
        followerRecords: uniqueFollowers,
      }
      fs.writeFileSync('xcom-followers.json', JSON.stringify(profile, null, 2))

      log.success(`write done ${uniqueFollowers.length} rows`)
      log.info(`followers: ${profile.followers}`)
      log.info(`verified followers: ${profile.verifiedFollowers}`)
    }
    // Save the results to a file (optional)
    // Step 6: Close the browser
    await destroyBrowser()
  }
  async getFollowingAccounts(): Promise<any> {
    if (isFileExisted(storageStatePath)) {
      const link = await profileLinkPrompt()
      const selectedProfile = await chromeProfileDictPrompt()
      console.log('selectedProfile --> ', selectedProfile)
      const browserContext = await getBrowserContext({ storageState: storageStatePath })
      const page = await browserContext.newPage()
      // await page.goto(link)
      // await page.waitForLoadState('networkidle');  // Wait until network is idle (no more requests)
      // // // Wait for the page to load completely
      // await page.waitForSelector('a[href$="/verified_followers"] > span') // Selector for the followers element

      // const followerCount = await page.$eval(
      //   'a[href$="/verified_followers"] > span',
      //   (el) => el.textContent,
      // )
      // Get the full HTML content of the page
      // const html = await page.content()

      // Log the HTML content
      // console.log(html)
      // fs.writeFileSync('pageContent.html', html)

      // Get list followers
      // Navigate to the Twitter profile followers page

      await page.goto(`${link}/followers`) // Replace 'elonmusk' with the desired username
      log.info(`navigate to ${link}/followers`)
      await page.waitForLoadState('networkidle') // Wait for all network requests to finish
      log.info(`network requests finished`)

      // Wait for the followers list to load
      await page.waitForSelector('div[aria-label="Timeline: Followers"]')

      const uniqueFollowers: ITwitterFollowerRecord[] = []

      const seenProfiles = new Set()
      const collectData = async () => {
        // Extract follower information
        const followers = await this.collectFollowers(page)

        for (const follower of followers) {
          if (!seenProfiles.has(follower.profileLink)) {
            seenProfiles.add(follower.profileLink)
            uniqueFollowers.push(follower)
          }
        }
      }
      await collectData()
      let currentLoaded = 0
      // // Scroll and collect follower info, handling lazy-loading
      while (currentLoaded < uniqueFollowers.length) {
        currentLoaded = uniqueFollowers.length
        // Get the current scroll height

        // Scroll down the page to load more followers
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight)
        })
        await page.waitForTimeout(3000) // Wait for new followers to load
        // Scroll down and collect followers
        await collectData()
        log.success(`${uniqueFollowers.length} rows loaded`)
      }

      // while (true) {
      //   // Get the current scroll height
      //   previousHeight = await page.evaluate('document.body.scrollHeight')

      //   // Scroll down the page to load more followers
      //   // eslint-disable-next-line @typescript-eslint/no-loop-func
      //   await page.evaluate(() => {
      //     window.scrollBy(0, window.innerHeight)
      //   })
      //   await page.waitForTimeout(2000) // Wait for new followers to load

      //   // Extract followers currently visible on the page
      //   // eslint-disable-next-line @typescript-eslint/no-loop-func
      //   const newFollowers = await page.evaluate(async () => {
      //     const followerElements = page.locator('div[data-testid="UserCell"]')
      //     const followerData: { name?: string; profileURL?: string; isFollowing?: boolean }[] = []
      //     const count = await followerElements.count()
      //     for (let i = 0; i < count; i++) {
      //       const follower = followerElements.nth(i) // Select the nth follower element
      //       const aTag = await follower.locator('a[role="link"]')
      //       log.success(`aTag ${aTag}`)
      //       // Use locators to extract the follower's name, profile URL, and following status
      //       const name = await aTag.innerText() // Get the follower's name
      //       const profileURL = (await aTag.getAttribute('href')) || '' // Get the profile URL
      //       const isFollowing = (await follower.locator('div[aria-label="Following"]').count()) > 0 // Check if following

      //       followers.push({ name, profileURL, isFollowing }) // Add follower info to the array
      //     }

      //     return followerData
      //   })

      //   // Add new followers to the list
      //   followers = [...followers, ...newFollowers]

      //   // Check if more content is loading by comparing scroll heights
      //   currentHeight = await page.evaluate('document.body.scrollHeight')

      //   // Break the loop if no more content is loading (lazy-loading stops)
      //   if (currentHeight === previousHeight) {
      //     break
      //   }
      // }
      const profile: ITwitterProfile = {
        followers: uniqueFollowers.length,
        verifiedFollowers: uniqueFollowers.filter((item) => item.isVerifiedAccount).length,
        followerRecords: uniqueFollowers,
      }
      fs.writeFileSync('followers.json', JSON.stringify(profile, null, 2))

      log.success(`write done ${uniqueFollowers.length} rows`)
      log.info(`followers: ${profile.followers}`)
      log.info(`verified followers: ${profile.verifiedFollowers}`)
    }
    // Save the results to a file (optional)
    // Step 6: Close the browser
    await destroyBrowser()
  }

  private normalizeTwitterLink(link: string | undefined | null): string {
    const output = link ? link.replace('twitter', 'x') : ''
    return output.toLocaleLowerCase()
  }
  async checkFollowerStateFromCheckList() {
    const profile = await readJsonFile<ITwitterProfile>('followers.json')
    const followers = profile.followerRecords
    const checkList = await readCSVFile<{ twitterUrl: string }>('followers_list.csv')
    const noLabel = colorize('No', 'red')
    const yesLabel = colorize('Yes', 'green')
    const unfollow: string[] = []
    checkList.forEach((link) => {
      const selected = followers.find(
        (item) =>
          this.normalizeTwitterLink(item.profileLink) ===
          this.normalizeTwitterLink(link.twitterUrl),
      )
      if (selected) {
        const isFollowed = selected.isFollowed ? yesLabel : noLabel
        log.success(`${selected.profileLink} | Follow me: ${yesLabel} | Followed: ${isFollowed} `)
      } else {
        // log.error(`${link.twitterUrl} | Follow me: ${noLabel} `)
        unfollow.push(link.twitterUrl)
      }
    })
    log.error(`Unfollow List: ${unfollow.length}`)
    unfollow.forEach((link) => {
      log.info(`${link} `)
    })
    if (unfollow.length > 0) {
      await this.checkProfileRestricted(unfollow)
    }
    await destroyBrowser()
  }
  async isProfileRestricted(
    page: Page,
    username: string,
  ): Promise<'active' | 'not-found' | 'restricted' | 'error'> {
    try {
      await page.locator('a[data-testid="AppTabBar_Explore_Link"]').click()
      await page.waitForTimeout(300) // Thời gian chờ có thể điều chỉnh

      // Tìm search box và nhập username
      await page.locator('input[data-testid="SearchBox_Search_Input"]').fill(`@${username}`)
      // await page.keyboard.press('Enter')

      // Chờ trang kết quả tìm kiếm tải xong
      await page.waitForTimeout(2000) // Thời gian chờ có thể điều chỉnh
      const countSearch = await page.locator('button[data-testid="TypeaheadUser"]').count()
      if (countSearch) {
        await page.locator('button[data-testid="TypeaheadUser"]').first().click()
        await page.waitForTimeout(2000) // Thời gian chờ có thể điều chỉnh
        const restricted = await page.locator('div[data-testid="empty_state_header_text"]').count()
        // console.log(`restricted ${restricted > 0}`)
        return restricted > 0 ? 'restricted' : 'active'
      }
      await page.locator('input[data-testid="SearchBox_Search_Input"]').focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(300) // Thời gian chờ có thể điều chỉnh
      // console.log(`countSearch ${countSearch}`)
      return 'not-found'
      // Click vào profile đầu tiên trong kết quả tìm kiếm
      // await page
      //   .locator('a[href*="/' + username + '"]')
      //   .first()
      //   .click()

      // Kiểm tra xem có thông báo "This account’s Tweets are protected" không
    } catch (error) {
      console.log(`Không thể kiểm tra ${username}`)
      return 'error'
    }
  }
  async checkProfileRestricted(profileUrls: string[]) {
    function extractUsername(url: string) {
      // Tách username bằng cách lấy phần cuối của URL sau dấu "/"
      const parts = url.split('/')
      return parts[parts.length - 1]
    }
    const usernames = profileUrls.map((url) => [extractUsername(url), url])
    const restrictedProfiles: string[] = []
    if (isFileExisted(storageStatePath)) {
      const selectedProfile = await chromeProfileDictPrompt()
      console.log('selectedProfile --> ', selectedProfile)
      const browserContext = await getBrowserContext({ storageState: storageStatePath })
      const page = await browserContext.newPage()
      await page.goto('https://x.com', { waitUntil: 'domcontentloaded' })
      for (const [username, profileUrl] of usernames) {
        const state = await this.isProfileRestricted(page, username)
        if (state === 'restricted') {
          restrictedProfiles.push(profileUrl)
          log.warn(profileUrl)
        } else if (state === 'active') {
          log.error(profileUrl)
        } else if (state === 'not-found') {
          log.info(profileUrl)
        }
      }
    }
    // log.error(`Profile Restricted`)
    // restrictedProfiles.forEach((item) => {
    //   log.error(`${item}`)
    // })
  }

  private async collectFollowers(page: Page): Promise<ITwitterFollowerRecord[]> {
    const followers = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button[data-testid="UserCell"]')).map(
        (followerRow) => {
          const name = followerRow.querySelector('[dir="ltr"] > span > span')?.textContent?.trim()
          const profileLink = followerRow.querySelector('a')?.href
          const isFollowed = followerRow.querySelector('[data-testid$="-unfollow"]') !== null
          const isVerifiedAccount =
            followerRow.querySelector('[data-testid="icon-verified"]') !== null
          return {
            name,
            profileLink: profileLink ? `${profileLink}` : null,
            isFollowed,
            isVerifiedAccount,
          }
        },
      )
    })
    return followers
  }
}
export const Twitter = new TwitterService()
