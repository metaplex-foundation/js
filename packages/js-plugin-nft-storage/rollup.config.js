import { createConfigs } from '../../rollup.config';
import pkg from './package.json';

export default createConfigs({
  pkg,
  dependenciesToExcludeInBundle: [
    '@metaplex-foundation/js',
    '@ipld/dag-pb',
    '@nftstorage/metaplex-auth',
    'ipfs-car',
    'ipfs-unixfs',
    'multiformats',
    'nft.storage',
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
