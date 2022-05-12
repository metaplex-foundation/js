import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { metaplex, createNft, killStuckProcess } from 'test/helpers';

killStuckProcess();

test('it can fetch an NFT by its mint address', async (t: Test) => {
  // Given a metaplex instance and an existing NFT.
  const mx = await metaplex();
  const mint = Keypair.generate();
  const nft = await createNft(mx, { name: 'Some NFT' }, { mint });

  // When we fetch that NFT using its mint address.
  const fetchedNft = await mx.nfts().findByMint(mint.publicKey);

  // Then we get the right NFT.
  t.true(fetchedNft.equals(nft));
});

test('it can fetch an NFT with an invalid URI', async (t: Test) => {
  // Given an existing NFT with an invalid URI.
  const mx = await metaplex();
  const { nft } = await mx.nfts().create({
    uri: 'https://example.com/some/invalid/uri',
  });

  // When we fetch that NFT using its mint address.
  const fetchedNft = await mx.nfts().findByMint(nft.mint);

  // Then we get the right NFT.
  t.true(fetchedNft.equals(nft));

  // And its metadata is empty.
  t.same(fetchedNft.metadata, {});
  t.equals(fetchedNft.metadataTask.getStatus(), 'failed');
});
