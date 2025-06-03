import { defineConfig } from 'tsup';
import pkg from './package.json';

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
  globalName: pkg.name,
});