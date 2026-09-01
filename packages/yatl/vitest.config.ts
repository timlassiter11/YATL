import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/table/table.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            // https://vitest.dev/config/browser/playwright
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/table/table.test.ts', 'dist/**', 'node_modules/**'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
