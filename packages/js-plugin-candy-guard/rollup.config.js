import { createConfigs } from '../../rollup.config';
import pkg from './package.json';

export default createConfigs({
  pkg,
  dependenciesToExcludeInBundle: ['@metaplex-foundation/js'],
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
