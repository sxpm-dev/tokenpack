import { AlgorithmCatalog } from 'tokenpack/algorithms/catalog'

import { ALL_NODE_ALGORITHMS } from '.'

export const nodeAlgorithmCatalog = new AlgorithmCatalog()

for (const Ctor of ALL_NODE_ALGORITHMS) {
  nodeAlgorithmCatalog.register(Ctor as never)
}

export const algorithmCatalog = nodeAlgorithmCatalog

