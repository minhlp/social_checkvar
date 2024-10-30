import { WinstonColorsType } from '~/interfaces'

export function colorize(str: string, color: WinstonColorsType) {
  const codes = {
    red: 31,
    yellow: 33,
    blue: 36,
    green: 32,
    white: 37,
  }

  const code = codes[color] || 37
  return `\u001b[${code}m${str}\u001b[0m`
}
