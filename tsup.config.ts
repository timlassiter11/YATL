import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'datatable': 'src/index.ts',
  },
  format: ['cjs', 'esm', 'iife'],
  outDir: 'dist',
  dts: true,
  splitting: false,
  sourcemap: true,
  minify: true,
  globalName: 'yatl',
});