const { test } = require('tape');
const { Connection } = require('@solana/web3.js');
const { LOCALHOST } = require('@metaplex-foundation/amman-client');
const exported = require('../dist/cjs/index.cjs');

test('[cjs] it successfully exports commonjs named exports', (t) => {
  const exportedKeys = Object.keys(exported);

  t.ok(exportedKeys.includes('Metaplex'));
  t.end();
});

test('[cjs] it can import the Irys client', async (t) => {
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

test('[cjs] it can import Merkle helpers', async (t) => {
  const { getMerkleRoot, getMerkleProof } = exported;
  const data = ['a', 'b', 'c', 'd', 'e'];
  const merkleRoot = getMerkleRoot(data);
  const merkleProof = getMerkleProof(data, 'a');
  t.ok(typeof merkleRoot === 'object', 'Merkle Root is an object');
  t.ok(Array.isArray(merkleProof), 'Merkle Proof is an array');
  t.end();
});
