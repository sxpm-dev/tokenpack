import type { CodecMetadata } from '../types'

export const predictMetadata: CodecMetadata = {
  pixelLayout: 'RGB · predictor residuals',
  writeStyle: 'sequential residuals',
  dependencies: 'none (pure JS)',
  beFriendly: 'yes',
  feFriendly: 'yes',
  streamFriendly: 'no',
  approxRatio: '15-18% with brotli',
  description:
    'Predictive transform that leaves residuals for outer compression while keeping decode under the gate.',
  family: 'legacy',
  familyLabel: 'Legacy',
}

export const predictInfo = { id: 10, name: 'predict', metadata: predictMetadata } as const
