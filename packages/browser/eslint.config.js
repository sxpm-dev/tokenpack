import sharedConfig from 'tokenpack-eslint-config'

export default [
  ...sharedConfig,
  { ignores: ['dist/**', 'node_modules/**'] },
]
