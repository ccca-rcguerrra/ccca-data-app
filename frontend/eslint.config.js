import tseslint from 'typescript-eslint';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import pluginImport from 'eslint-plugin-import';
import pluginJs from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginImport.flatConfigs.recommended,
  {
    settings: {
      react: {
        version: 'detect',
      },

      'import/resolver': {
        node: {
          paths: ['src'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        alias: {
          map: [['@', './src']],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },

    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-no-target-blank': 'off',

      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/named': 'off',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'desc',
            caseInsensitive: true,
          },
        },
      ],

      // All localStorage access must go through StorageService
      // (except the service itself). Zustand stores use
      // StorageService.createPersistStorage() as their persist driver.
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message:
            'Use StorageService from @/services/storage/storage.service instead of accessing localStorage directly.',
        },
      ],
    },
  },
  {
    files: ['src/services/storage/storage.service.ts'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },
];
