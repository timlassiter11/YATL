import { defineConfig } from 'tsup';

export default defineConfig([
  // -------------------------------------------------------------
  // CONFIG 1: NPM Package (ESM & CJS)
  // Designed for bundlers (Vite, Webpack, etc.)
  // -------------------------------------------------------------
  {
    entry: {
      'index': 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    outDir: 'dist',
    dts: true,      // Generate types only for this build
    sourcemap: true,
    clean: true,    // Clear dist folder on start
    splitting: false,
    
    // CRITICAL: Do NOT bundle Lit. 
    // Let the consumer's bundler resolve their version of Lit.
    external: [/^lit/], 
  },

  // -------------------------------------------------------------
  // CONFIG 2: CDN Bundle (IIFE)
  // Designed for direct <script> usage
  // -------------------------------------------------------------
  {
    entry: {
      'yatl.min': 'src/index.ts', // Explicit name for the bundle
    },
    format: ['iife'],
    outDir: 'dist',
    sourcemap: true,
    minify: true,   // Only minify the browser bundle
    globalName: 'yatl',
    
    // CRITICAL: Force Lit to be bundled inside
    noExternal: [/^lit/], 
    
    // Ensure we don't generate duplicate d.ts files
    dts: false, 
  }
]);