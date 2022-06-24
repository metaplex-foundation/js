import * as exported from '../dist/esm/index.mjs';
import test from 'tape';
import { Connection } from '@solana/web3.js';
import { LOCALHOST } from '@metaplex-foundation/amman-client';

test('[esm] it successfully exports esm named exports', (t) => {
  const exportedKeys = Object.keys(exported);

  t.ok(exportedKeys.includes('Metaplex'));
  t.end();
});

test('[esm] it can import the Bundlr client', async (t) => {
  const { BundlrStorageDriver, Metaplex } = exported;
  const connection = new Connection(LOCALHOST);
  const metaplex = new Metaplex(connection);
  const bundlrDriver = new BundlrStorageDriver(metaplex);
  const bundlr = await bundlrDriver.bundlr();
  t.ok(typeof bundlr === 'object', 'Bundlr is an object');
  t.ok('uploader' in bundlr, 'Bundlr can upload');
  t.ok('getLoadedBalance' in bundlr, 'Bundlr can get the loaded balance');
  t.ok('fund' in bundlr, 'Bundlr can fund');
  t.ok('withdrawBalance' in bundlr, 'Bundlr can withdraw');
  t.end();
});
