import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default [
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': hooksPlugin,
      prettier: prettierPlugin
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...hooksPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/ban-ts-comment': 'off'
    }
  },
  prettierConfig,
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**']
  }
]
