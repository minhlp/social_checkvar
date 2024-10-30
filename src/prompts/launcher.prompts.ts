import inquirer, { QuestionCollection } from 'inquirer'
import { LAUNCH_MODE_ENUM } from '~/enums'
export const launchPrompt = async (): Promise<LAUNCH_MODE_ENUM> => {
  const questions: QuestionCollection = [
    {
      type: 'list',
      name: 'action',
      message: 'Select an action',
      choices: [
        { key: 1, name: 'Login', value: LAUNCH_MODE_ENUM.login },
        { key: 2, name: 'Get Followers', value: LAUNCH_MODE_ENUM.get_followers },
        { key: 3, name: 'Followers Checklist', value: LAUNCH_MODE_ENUM.followers_checklist },
      ],
    },
  ]

  const { action } = await inquirer.prompt(questions)
  return action
}
