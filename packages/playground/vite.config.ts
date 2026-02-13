import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: '/YATL/',
  server: {
    port: 5174,
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: [
      {
        find: '@timlassiter11/yatl/theme.css',
        replacement: path.resolve(__dirname, '../yatl/src/theme.css'),
      },
      {
        find: '@timlassiter11/yatl',
        // Route them directly to the raw TypeScript source
        replacement: path.resolve(__dirname, '../yatl/src/index.ts'),
      },
      {
        // Intercept imports to the UI package
        find: '@timlassiter11/yatl-ui',
        replacement: path.resolve(__dirname, '../yatl-ui/src/index.ts'),
      },
    ],
  },
});
