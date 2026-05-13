import '@tokenpack/node'

/* eslint-disable no-console */
import {
  generateEncodedDocumentFixtures,
  generateRootPack,
  type JsonTokenAlgo,
  loadJsonPlaygroundData,
  rootPackPath,
} from '../src/app/api/json-playground/_shared'

const TOKEN_ALGOS: JsonTokenAlgo[] = ['pixel-range-none-c3', 'linear-deflate-c3']

async function main() {
  const data = loadJsonPlaygroundData()

  generateEncodedDocumentFixtures()
  const metas = await Promise.all(TOKEN_ALGOS.map(algo => generateRootPack(algo)))

  console.log(
    [
      'JSON playground fixture generated',
      'compressed-docs=ready',
      `source=${data.sourceBytes.byteLength}B`,
      `roots=${data.rootKeys.length}`,
      `records=${data.records.length}`,
      ...metas.map(meta => `${meta.algo}=${meta.tokenBytes}B`),
      ...TOKEN_ALGOS.map(algo => `path:${algo}=${rootPackPath(algo)}`),
    ].join(' · '),
  )
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
