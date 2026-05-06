// React/Next layer for the tokenpack monorepo.
//
// Compose strategy: eslint-config-next registers @typescript-eslint, react,
// jsx-a11y, and import plugins via its flat config. We add the plugins it
// DOESN'T provide (unused-imports, simple-import-sort, prettier) plus our
// base rules on top.
//
// Non-Next packages use `./index.js` directly (full plugin set there).

import { fixupPluginRules } from '@eslint/compat'
import nextEslintConfig from 'eslint-config-next'
import prettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'

import {
  baseIgnores,
  baseLanguageOptions,
  baseRules,
  prettierConfig,
} from './index.js'

export const nextConfig = [
  baseIgnores,
  ...nextEslintConfig,
  ...prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      // Only the plugins that eslint-config-next does NOT already register.
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
      prettier: fixupPluginRules(prettier),
    },
    languageOptions: baseLanguageOptions,
    rules: {
      ...baseRules,
      // React-specific overrides on top of Next's defaults.
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'react/self-closing-comp': 'warn',
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          shorthandFirst: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
    },
    settings: { react: { version: 'detect' } },
  },
]

export default nextConfig
