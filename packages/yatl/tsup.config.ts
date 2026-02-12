import { defineConfig, type Options } from 'tsup';

export default defineConfig(options => {
  return [
    {
      entry: {
        theme: 'src/theme.css',
      },
      clean: !options.watch,
      tsconfig: './tsconfig.json'
    },
    {
      entry: {
        index: 'src/index.ts',
      },
      format: ['esm', 'cjs'],
      outDir: 'dist',
      dts: true,
      sourcemap: true,
      clean: !options.watch,
      splitting: false,
      target: 'es2024',
      // Don't bundle Lit
      external: [/^lit/, /^@lit/],
      tsconfig: './tsconfig.json'
    },
    {
      entry: {
        'yatl.min': 'src/index.ts',
      },
      format: ['iife'],
      outDir: 'dist',
      sourcemap: true,
      minify: true,
      clean: !options.watch,
      globalName: 'yatl',
      target: 'es2024',
      platform: 'browser',
      // Bundle Lit
      noExternal: [/^lit/, /^@lit/],
      // Don't generate duplicate d.ts files
      dts: false,
      tsconfig: './tsconfig.json'
    },
  ] as Options[];
});
