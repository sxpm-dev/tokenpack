import sharedConfig from 'tokenpack-eslint-config'

export default [
  ...sharedConfig,
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/browser/bootstrap.ts'],
    rules: { 'no-console': 'off' },
  },
]
