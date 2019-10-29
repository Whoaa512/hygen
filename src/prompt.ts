import path from 'path'
import fs from 'fs'
import { Prompter } from './types'

const flatMap = (arr, f) => [].concat(...arr.map(f))

const hooks = ['prompt', 'index']
const supportedExts = ['js', 'ts']
const hooksfiles = flatMap(hooks, (hook: string) =>
  flatMap(supportedExts, (ext: string) =>
    `${hook}.${ext}`
  )
)
const prompt = (
  createPrompter: () => Prompter,
  actionfolder: string,
  args: Record<string, any>,
): Promise<any> => {
  const hooksfile = hooksfiles
    .map(f => path.resolve(path.join(actionfolder, f)))
    .find(f => fs.existsSync(f))

  if (!hooksfile) {
    return Promise.resolve({})
  }

  // shortcircuit without prompter
  // $FlowFixMe
  const hooksModule = require(hooksfile)
  if (hooksModule.params) {
    return hooksModule.params({ args })
  }

  // lazy loads prompter
  // everything below requires it
  const prompter = createPrompter()
  if (hooksModule.prompt) {
    return hooksModule.prompt({ prompter, inquirer: prompter, args })
  }

  return prompter.prompt(
    // prompt _only_ for things we've not seen on the CLI
    hooksModule.filter(
      p =>
        args[p.name] === undefined ||
        args[p.name] === null ||
        args[p.name].length === 0,
    ),
  )
}

export default prompt
