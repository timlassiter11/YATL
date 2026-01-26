import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      'index': 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    target: 'es2020',
    // Don't bundle Lit
    external: [/^lit/, /^@lit/],
  },
  {
    entry: {
      'yatl.min': 'src/index.ts',
    },
    format: ['iife'],
    outDir: 'dist',
    sourcemap: true,
    minify: true,
    globalName: 'yatl',
    target: 'es2020',
    platform: 'browser',
    // Bundle Lit
    noExternal: [/^lit/, /^@lit/],
    // Don't generate duplicate d.ts files
    dts: false, 
  }
]);