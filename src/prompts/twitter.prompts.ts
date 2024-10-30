import inquirer, { QuestionCollection } from 'inquirer'

export const profileLinkPrompt = async (): Promise<string> => {
  const questions: QuestionCollection = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter a link of profile',
    },
  ]

  const { name = '' } = await inquirer.prompt(questions)

  if (!name) return profileLinkPrompt()
  return name
}
