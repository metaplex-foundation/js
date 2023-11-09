import test from 'tape';
import { Connection } from '@solana/web3.js';
import { LOCALHOST } from '@metaplex-foundation/amman-client';
import * as exported from '../dist/esm/index.mjs';

test('[esm] it successfully exports esm named exports', (t) => {
  const exportedKeys = Object.keys(exported);

  t.ok(exportedKeys.includes('Metaplex'));
  t.end();
});

test('[esm] it can import the Irys client', async (t) => {
  const { IrysStorageDriver, Metaplex } = exported;
  const connection = new Connection(LOCALHOST);
  const metaplex = new Metaplex(connection);
  const irysDriver = new IrysStorageDriver(metaplex);
  const irys = await irysDriver.irys();
  t.ok(typeof irys === 'object', 'Irys is an object');
  t.ok('uploader' in irys, 'Irys can upload');
  t.ok('getLoadedBalance' in irys, 'Irys can get the loaded balance');
  t.ok('fund' in irys, 'Irys can fund');
  t.ok('withdrawBalance' in irys, 'Irys can withdraw');
  t.end();
});

test('[esm] it can import Merkle helpers', async (t) => {
  const { getMerkleRoot, getMerkleProof } = exported;
  const data = ['a', 'b', 'c', 'd', 'e'];
  const merkleRoot = getMerkleRoot(data);
  const merkleProof = getMerkleProof(data, 'a');
  t.ok(typeof merkleRoot === 'object', 'Merkle Root is an object');
  t.ok(Array.isArray(merkleProof), 'Merkle Proof is an array');
  t.end();
});
