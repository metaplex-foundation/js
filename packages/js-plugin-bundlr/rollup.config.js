import { createConfigs } from '../../rollup.config';
import pkg from './package.json';

export default createConfigs({
  pkg,
  dependenciesToExcludeInBundle: Object.keys(pkg.dependencies),
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
