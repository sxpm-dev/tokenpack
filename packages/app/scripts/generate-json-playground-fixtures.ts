/* eslint-disable no-console */

import '@tokenpack/node'

import {
  generateRootPack,
  loadJsonPlaygroundData,
  rootPackPath,
} from '../src/app/api/json-playground/_shared'

async function main() {
  const data = loadJsonPlaygroundData()
  const meta = await generateRootPack()

  console.log(
    [
      'JSON playground fixture generated',
      `source=${data.sourceBytes.byteLength}B`,
      `roots=${data.rootKeys.length}`,
      `records=${data.records.length}`,
      `token=${meta.tokenBytes}B`,
      `path=${rootPackPath()}`,
    ].join(' · '),
  )
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
