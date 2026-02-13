// @ts-check

import { sharedConfig } from '../../eslint.config.mjs';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...sharedConfig,
  {
    ignores: ['node_modules', 'dist'],
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);