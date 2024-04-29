import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import ts from 'typescript-eslint'

const compat = new FlatCompat()

export default [
  {
    ignores: [
      '**/generated/*.ts',
      'dist/**',
      'lib/**'
    ]
  },
  ...ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...compat.config({
      extends: [
        'standard',
        // 'plugin:import/recommended',
        // 'plugin:n/recommended',
        'plugin:promise/recommended',
        'plugin:jest/recommended'
      ]
    }),
    {
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module'
        }
      }
    }
  )
]
