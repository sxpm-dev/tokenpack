import { AlgorithmCatalog } from 'tokenpack/algorithms/catalog'

import { ALL_BROWSER_ALGORITHMS } from '.'

export const browserAlgorithmCatalog = new AlgorithmCatalog()

for (const Ctor of ALL_BROWSER_ALGORITHMS) {
  browserAlgorithmCatalog.register(Ctor as never)
}

export const algorithmCatalog = browserAlgorithmCatalog

