import inquirer, { QuestionCollection } from 'inquirer'
import { findChromeProfileFolderDicts } from '~/utils/find-chrome'

export const chromeProfileDictPrompt = async (): Promise<string> => {
  // Read the profile folders from the Chrome profile path
  const profiles = findChromeProfileFolderDicts()

  const questions: QuestionCollection = [
    {
      type: 'list',
      name: 'profile',
      message: 'Please select a Chrome profile to use:',
      choices: profiles, // Provide the list of profiles as choices
    },
  ]

  const answer = await inquirer.prompt(questions)
  return answer.profile
}
