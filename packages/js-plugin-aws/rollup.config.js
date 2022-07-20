import { createConfigs } from '../../rollup.config';
import pkg from './package.json';

export default createConfigs({
  pkg,
  dependenciesToExcludeInBundle: [
    '@metaplex-foundation/js',
    '@aws-sdk/client-s3',
  ],
  builds: [
    {
      dir: 'dist/esm',
      format: 'es',
      bundle: true,
    },
    {
      dir: 'dist/cjs',
      format: 'cjs',
      bundle: true,
    },
  ],
});
