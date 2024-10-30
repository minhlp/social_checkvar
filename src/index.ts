import { log } from '~/services'
// import { AUTHOR } from '~/constants'
import { LAUNCH_MODE_ENUM } from '~/enums'
import { launchPrompt } from '~/prompts'
import { Twitter } from './services/twitter.service'

const launcher = async () => {
  const action = await launchPrompt()
  const { login, get_followers, followers_checklist } = LAUNCH_MODE_ENUM

  switch (action) {
    case login:
      await Twitter.login()
      log.success('login done')
      break
    case get_followers:
      const count = await Twitter.getFollowers()
      log.success('done', count)
      break
    case followers_checklist:
      await Twitter.checkFollowerStateFromCheckList()
      break
  }
}

try {
  launcher()
} catch (e) {
  log.error(String(e))
}
