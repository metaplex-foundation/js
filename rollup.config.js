import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const builds = [
  {
    dir: 'dist/esm',
    format: 'es',
  },
  {
    dir: 'dist/cjs',
    format: 'cjs',
  },
];

// The options below can be used to configure what should be bundled.
// Currently, we're not bundling our library to support tree-shaking.
const extensions = ['.js', '.ts'];
const globals = {};
const allDependencies = Object.keys(pkg.dependencies);
const dependenciesToExcludeInBundle = [];
const dependenciesToDedupes = [];

const createConfig = (build) => {
  const {
    file,
    dir,
    format,
    name,
    browser = false,
    bundle = false,
    minified = false,
  } = build;

  const external = allDependencies.filter((dependency) => {
    return !bundle || dependenciesToExcludeInBundle.includes(dependency);
  });

  const outputExtension = format === 'es' ? 'mjs' : 'cjs';
  const entryFileNames = bundle ? undefined : `[name].${outputExtension}`;

  return {
    input: ['src/index.ts'],
    output: {
      dir,
      file,
      format,
      name,
      entryFileNames,
      exports: 'named',
      preserveModules: !bundle,
      sourcemap: true,
      globals,
    },
    external,
    treeshake: {
      moduleSideEffects: false,
    },
    plugins: [
      commonjs(),
      nodeResolve({
        browser,
        dedupe: dependenciesToDedupes,
        extensions,
        preferBuiltins: !browser,
      }),
      babel({
        exclude: '**/node_modules/**',
        extensions,
        babelHelpers: 'bundled',
      }),
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.BROWSER': JSON.stringify(browser),
        },
      }),
      ...(bundle ? [json(), nodePolyfills()] : []),
      ...(minified ? [terser()] : []),
    ],
    onwarn: function (warning, rollupWarn) {
      rollupWarn(warning);
      if (!bundle && warning.code === 'CIRCULAR_DEPENDENCY') {
        const msg =
          'Please eliminate the circular dependencies listed above and retry the build';
        throw new Error(msg);
      }
    },
  };
};

export default builds.map((build) => createConfig(build));
