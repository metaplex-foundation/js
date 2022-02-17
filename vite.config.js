import path from 'path'
import { defineConfig  } from 'vite';
import * as pkg from './package.json';

const external = [
  ...Object.keys(pkg.peerDependencies || {}),
];

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MetaplexSDK',
      fileName: (format) => `metaplex-sdk.${format}.js`,
    },
    rollupOptions: {
      external: [external],
    }
  }
});
