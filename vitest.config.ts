import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// Each package still has its own standalone vitest.config.ts (used by its
// own `npm run test` script, and by `packages/yatl`'s further internal
// browser/unit split). This config exists for tooling that runs from the
// repo root (e.g. the VS Code Vitest extension) and needs one flat list of
// projects to see everything at once. It's intentionally NOT built by
// pointing `projects` at `packages/*` and letting Vitest load each
// package's own config - packages/yatl's config itself defines further
// sub-projects, and that "project referencing a project" nesting is a
// known rough edge for editor tooling (though the Vitest CLI handles it
// fine). Flattening to one level here avoids that, at the cost of the
// browser/unit split below being duplicated from packages/yatl/vitest.config.ts.
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'yatl (browser)',
          root: 'packages/yatl',
          include: ['src/table/table.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'yatl (unit)',
          root: 'packages/yatl',
          include: ['src/**/*.test.ts'],
          exclude: ['src/table/table.test.ts', 'dist/**', 'node_modules/**'],
          environment: 'jsdom',
        },
      },
      {
        extends: true,
        test: {
          name: 'yatl-ui',
          root: 'packages/yatl-ui',
          include: ['src/**/*.test.ts'],
          exclude: ['dist/**', 'node_modules/**'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
