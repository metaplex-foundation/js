import path from 'path'
import { defineConfig  } from 'vite';
import * as pkg from './package.json';

export default defineConfig({
  resolve: {
    dedupe: ['bn.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MetaplexSDK',
      fileName: (format) => `metaplex-sdk.${format}.js`,
    },
    rollupOptions: {
      external: [
        ...Object.keys(pkg.peerDependencies || {}),
      ],
    },
  }
});
