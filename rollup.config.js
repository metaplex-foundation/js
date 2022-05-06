import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import generatePackageJson from 'rollup-plugin-generate-package-json';
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
  {
    dir: 'dist/esm-browser',
    format: 'es',
    browser: true,
  },
  {
    dir: 'dist/cjs-browser',
    format: 'cjs',
    browser: true,
  },
  {
    file: 'dist/iife/index.js',
    format: 'iife',
    name: 'MetaplexSDK',
    browser: true,
    bundle: true,
  },
  {
    file: 'dist/iife/index.min.js',
    format: 'iife',
    name: 'MetaplexSDK',
    browser: true,
    bundle: true,
    minified: true,
  },
];

const extensions = ['.js', '.ts'];
const allDependencies = Object.keys(pkg.dependencies);
const dependenciesToDedupes = ['bn.js', 'buffer'];
const dependenciesToBundle = [
  '@metaplex-foundation/beet',
  '@metaplex-foundation/beet-solana',
  '@metaplex-foundation/mpl-candy-machine',
  '@metaplex-foundation/mpl-token-metadata',
  'assert',
  'buffer',
];

const globals = {
  '@aws-sdk/client-s3': 'AwsS3Client',
  '@bundlr-network/client': 'BundlrNetworkClient',
  '@metaplex-foundation/beet': 'MetaplexBeet',
  '@metaplex-foundation/beet-solana': 'MetaplexBeetSolana',
  '@metaplex-foundation/mpl-candy-machine': 'MetaplexMplCandyMachine',
  '@metaplex-foundation/mpl-token-metadata': 'MetaplexMplTokenMetadata',
  '@solana/spl-token': 'SolanaSplToken',
  '@solana/wallet-adapter-base': 'SolanaWalletAdapterBase',
  '@solana/web3.js': 'SolanaWeb3',
  assert: 'Assert',
  'abort-controller': 'AbortController',
  'bignumber.js': 'BigNumber',
  'bn.js': 'BN',
  bs58: 'Bs58',
  buffer: 'Buffer',
  'cross-fetch': 'CrossFetch',
  debug: 'Debug',
  eventemitter3: 'EventEmitter3',
  'lodash.clonedeep': 'LodashClonedeep',
  mime: 'Mime',
  tweetnacl: 'Tweetnacl',
};

const createConfig = (build) => {
  const { file, dir, format, name, browser = false, bundle = false, minified = false } = build;

  const external = allDependencies.filter((dependency) => {
    return !bundle || !dependenciesToBundle.includes(dependency);
  });

  return {
    input: ['src/index.ts'],
    output: {
      dir,
      file,
      format,
      name,
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
        babelHelpers: bundle ? 'bundled' : 'runtime',
        plugins: bundle ? [] : ['@babel/plugin-transform-runtime'],
      }),
      replace({
        preventAssignment: true,
        values: {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.BROWSER': JSON.stringify(browser),
        },
      }),
      ...(!bundle && dir
        ? [
            generatePackageJson({
              baseContents: {
                type: format === 'cjs' ? 'commonjs' : 'module',
              },
            }),
          ]
        : []),
      ...(minified ? [terser()] : []),
    ],
  };
};

export default builds.map((build) => createConfig(build));
