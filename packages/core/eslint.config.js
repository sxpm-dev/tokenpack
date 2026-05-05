import sharedConfig from 'tokenpack-eslint-config'

export default [
  ...sharedConfig,
  {
    files: ['src/cli.ts'],
    rules: { 'no-console': 'off' },
  },
]
