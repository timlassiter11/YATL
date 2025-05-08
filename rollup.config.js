import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from '@rollup/plugin-terser'; // For minification (optional)
import postcss from 'rollup-plugin-postcss';
import { fileURLToPath } from 'url';


const libraryGlobalName = "yatl"; // Global variable name for the library
const mainFilePath = fileURLToPath(new URL('src/datatable.js', import.meta.url)); // Path to the main file

export default [
  // Bundle config
  {
    input: "src/index.js",
    output: [
      {
        file: "dist/esm/datatable.bundle.js",
        format: "es",
        sourcemap: true,
      },
      {
        file: "dist/cjs/datatable.bundle.js",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/umd/datatable.bundle.js",
        format: "umd",
        sourcemap: true,
        name: libraryGlobalName,
        exports: "named",
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      postcss({
        extract: 'datatable.css', // Extracts CSS to a single file named bundle.css
        minimize: false,        // Minify the CSS (optional)
        sourceMap: true,       // Generate source maps for CSS (optional)
      }),
    ],
  },
  // Minified bundle config
  {
    input: "src/index.js",
    output: [
      {
        file: "dist/esm/datatable.bundle.min.js",
        format: "es",
        sourcemap: true,
      },
      {
        file: "dist/cjs/datatable.bundle.min.js",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/umd/datatable.bundle.min.js",
        format: "umd",
        sourcemap: true,
        name: libraryGlobalName,
        exports: "named",
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      terser(),
      postcss({
        extract: 'datatable.min.css', // Extracts CSS to a single file named bundle.css
        minimize: true,        // Minify the CSS (optional)
        sourceMap: true,       // Generate source maps for CSS (optional)
        // You can add more PostCSS plugins here if needed:
        // plugins: [require('autoprefixer')()]
      }),
    ],
  },
  // Standalone library config
  {
    input: "src/datatable.js",
    output: [
      {
        file: "dist/esm/datatable.js",
        format: "es",
        sourcemap: true,
      },
      {
        file: "dist/cjs/datatable.js",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/umd/datatable.js",
        format: "umd",
        sourcemap: true,
        name: libraryGlobalName,
        exports: "named",
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      postcss({
        inject: false, // Don't inject styles into the DOM
        extract: false, // This is already handled in the main bundle config
      }),
    ],
  },
  // Save state plugin config
  {
    input: "src/plugins/localStorageAdapter.js",
    output: [
      {
        file: "dist/esm/localStorageAdapter.js",
        format: "es",
        sourcemap: true,
      },
      {
        file: "dist/cjs/localStorageAdapter.js",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/umd/localStorageAdapter.js",
        format: "umd",
        sourcemap: true,
        name: libraryGlobalName,
        exports: "named",
        globals: {
          [mainFilePath]: libraryGlobalName,
        }
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      postcss({
        inject: false, // Don't inject styles into the DOM
        extract: false, // This is already handled in the main bundle config
      }),
    ],
    external: [mainFilePath],
  },
];