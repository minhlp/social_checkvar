import * as fs from 'fs'
export function isFileExisted(path: string): boolean {
  return fs.existsSync(path)
}
