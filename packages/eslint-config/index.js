// Shared ESLint house style for the tokenpack monorepo.
// Plain TypeScript baseline (no React/Next assumptions). Use `./next` for the React/Next layer.

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
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

// Plugins block — used directly by non-Next packages. The Next layer composes
// `eslint-config-next` (which already registers @typescript-eslint, react,
// jsx-a11y, import) plus a rules-only block, to avoid plugin redefinition.
const basePlugins = {
  'unused-imports': unusedImports,
  'simple-import-sort': simpleImportSort,
  '@typescript-eslint': typescriptEslint,
  prettier: fixupPluginRules(prettier),
}

export const baseRules = {
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
  'padding-line-between-statements': [
    'warn',
    { blankLine: 'always', prev: '*', next: 'return' },
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
    { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
  ],
}

export const baseLanguageOptions = {
  globals: { ...globals.node },
  parser: tsParser,
  ecmaVersion: 12,
  sourceType: 'module',
}

export const baseIgnores = {
  ignores: [
    '**/node_modules',
    '**/dist',
    '**/build',
    '**/.next',
    '**/coverage',
    '**/*.tsbuildinfo',
    '**/.DS_Store',
  ],
}

export const prettierConfig = fixupConfigRules(compat.extends('plugin:prettier/recommended'))

export const baseConfig = [
  baseIgnores,
  ...prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: basePlugins,
    languageOptions: baseLanguageOptions,
    rules: baseRules,
  },
]

export default baseConfig
