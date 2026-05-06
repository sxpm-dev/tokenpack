import sharedConfig from 'tokenpack-eslint-config'

export default [
  ...sharedConfig,
  {
    files: ['src/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  { ignores: ['dist/**', 'node_modules/**'] },
]
