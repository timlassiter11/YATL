import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import copy from 'rollup-plugin-copy';

export default {
  input: "src/datatable.js", // Your JavaScript entry point
  output: [
    {
      file: "dist/datatable.umd.js",
      format: "umd",
      name: "yatl", // Global variable name for browsers
    },
    {
      file: "dist/datatable.esm.js",
      format: "es", // ES6 module format
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    copy({
      targets: [
        { src: 'src/datatable.css', dest: 'dist' },
      ]
    })
  ],
};