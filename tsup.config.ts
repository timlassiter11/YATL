import { defineConfig } from 'tsup';
import pkg from './package.json';

export default defineConfig({
  entry: {
    'datatable': 'src/index.ts',
  },
  format: ['esm', 'iife'], // Output formats
  outDir: 'dist', // Output directory
  dts: true, // Generate declaration files (.d.ts)
  splitting: false,
  sourcemap: true,
  minify: true,
  globalName: pkg.name, // For UMD build, the global variable name
  // external: ['your-external-dependency'], // If you have external dependencies
});