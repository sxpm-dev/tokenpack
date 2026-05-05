// Shared ESLint house style for the tokenpack monorepo.
// Plain TypeScript baseline (no React/Next assumptions). Use `./next` for the React/Next layer.

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import _import from 'eslint-plugin-import'
import prettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export const baseConfig = [
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/build',
      '**/.next',
      '**/coverage',
      '**/*.tsbuildinfo',
      '**/.DS_Store',
    ],
  },
  ...fixupConfigRules(compat.extends('plugin:prettier/recommended')),
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'unused-imports': unusedImports,
      import: fixupPluginRules(_import),
      'simple-import-sort': simpleImportSort,
      '@typescript-eslint': typescriptEslint,
      prettier: fixupPluginRules(prettier),
    },
    languageOptions: {
      globals: { ...globals.node },
      parser: tsParser,
      ecmaVersion: 12,
      sourceType: 'module',
    },
    rules: {
      'no-console': 'warn',
      'prettier/prettier': 'warn',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_.*?$',
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/order': 'off',
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
      ],
    },
  },
]

export default baseConfig
