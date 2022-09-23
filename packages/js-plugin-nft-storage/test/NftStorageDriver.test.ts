import { toMetaplexFile } from '@metaplex-foundation/js';
import test, { Test } from 'tape';
import { killStuckProcess, metaplex } from './helpers';
import { nftStorage, NftStorageDriver } from '../src';

killStuckProcess();

test('[nftStorage] it can upload one file', async (t: Test) => {
  // Given a Metaplex instance using NFT.Storage.
  const mx = await metaplex();
  mx.use(nftStorage());

  // When we upload some asset.
  const uri = await mx
    .storage()
    .upload(toMetaplexFile('some-image', 'some-image.jpg'));

  // Then the URI should be a valid IPFS URI.
  t.ok(uri, 'should return a URI');
  t.ok(
    uri.startsWith('https://nftstorage.link/ipfs/'),
    'should use Gateway URI by default'
  );

  // and it should point to the uploaded asset.
  const asset = await mx.storage().download(uri);
  t.equals(
    asset.buffer.toString(),
    'some-image',
    'should return the uploaded asset'
  );
});

test('[nftStorage] it can upload one file without a Gateway URL', async (t: Test) => {
  // Given a Metaplex instance using NFT.Storage without Gateway URLs.
  const mx = await metaplex();
  mx.use(nftStorage({ useGatewayUrls: false }));

  // When we upload some asset.
  const uri = await mx
    .storage()
    .upload(toMetaplexFile('some-image', 'some-image.jpg'));

  // Then the URI should be a valid IPFS URI but not a Gateway URL.
  t.ok(uri, 'should return a URI');
  t.ok(uri.startsWith('ipfs://'), 'should use Gateway URI by default');
});

test('[nftStorage] it can upload multiple files in batch', async (t: Test) => {
  // Given a Metaplex instance using NFT.Storage with a batch size of 1.
  const mx = await metaplex();
  mx.use(nftStorage({ batchSize: 1 }));

  // When we upload two assets.
  const uris = await mx
    .storage()
    .uploadAll([
      toMetaplexFile('some-image-A', 'some-image-A.jpg'),
      toMetaplexFile('some-image-B', 'some-image-B.jpg'),
    ]);

  // Then the URIs should point to the uploaded assets in the right order.
  t.equals(uris.length, 2, 'should return a list of 2 URIs');
  const assetA = await mx.storage().download(uris[0]);
  t.equals(
    assetA.buffer.toString(),
    'some-image-A',
    'should return the first asset'
  );
  const assetB = await mx.storage().download(uris[1]);
  t.equals(
    assetB.buffer.toString(),
    'some-image-B',
    'should return the second asset'
  );
});

test('[nftStorage] it can keep track of upload progress', async (t: Test) => {
  // Given a Metaplex instance using NFT.Storage.
  const mx = await metaplex();
  mx.use(nftStorage());

  // And a progress callback that counts the stored chunks.
  let chunkCounter = 0;
  const driver = mx.storage().driver() as NftStorageDriver;
  driver.onProgress((_size: number) => chunkCounter++);

  // When we upload some asset with a size of 3 chunks.
  const MAX_CHUNK_SIZE = 10_000_000;
  await mx
    .storage()
    .upload(toMetaplexFile('x'.repeat(MAX_CHUNK_SIZE * 3), 'some-image.jpg'));

  // Then the progress callback should be called 3 times.
  t.equals(chunkCounter, 3, 'should emit 3 progress events');
});
