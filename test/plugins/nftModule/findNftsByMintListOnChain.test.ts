import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { metaplex, createNft, killStuckProcess } from 'test/helpers';

killStuckProcess();

test('it can fetch all NFTs from a provided mint list', async (t: Test) => {
  // Given a metaplex instance and two NFTs on-chain.
  const mx = await metaplex();
  const nftA = await createNft(mx, { name: 'NFT A' });
  const nftB = await createNft(mx, { name: 'NFT B' });

  // When we fetch these NFTs by mint addresses.
  const nfts = await mx.nfts().findAllByMintList([nftA.mint, nftB.mint]);

  // Then we get the right NFTs.
  t.same(
    nfts.map((nft) => nft?.name),
    ['NFT A', 'NFT B']
  );
  t.true(nfts[0]?.equals(nftA));
  t.true(nfts[1]?.equals(nftB));
});

test('it can fetch all NFTs from a provided mint list', async (t: Test) => {
  // Given a metaplex instance and one NFT on-chain.
  const mx = await metaplex();
  const nft = await createNft(mx, { name: 'Some NFT' });

  // And two mint addresses with no NFT associated to them.
  const emptyMintA = Keypair.generate().publicKey;
  const emptyMintB = Keypair.generate().publicKey;

  // When we fetch NFTs matching all these addresses.
  const nfts = await mx
    .nfts()
    .findAllByMintList([emptyMintA, nft.mint, emptyMintB]);

  // Then we get null for mint not associated to any NFT.
  t.same(
    nfts.map((nft) => nft?.name ?? null),
    [null, 'Some NFT', null]
  );
});

test('it does not load the NFT metadata or master edition by default', async (t: Test) => {
  // Given a metaplex instance and a connected wallet with one nft.
  const mx = await metaplex();
  const nft = await createNft(mx, { name: 'Some NFT' });

  // When we fetch all NFTs in the wallet.
  const [fetchedNft] = await mx.nfts().findAllByMintList([nft.mint]);

  // Then the fetched NFTs do not have metadata.
  t.true(fetchedNft?.metadataTask.isPending());
  t.same(fetchedNft?.metadata, {});

  // Nor does it have a loaded master edition.
  t.true(fetchedNft?.editionTask.isPending());
  t.equal(fetchedNft?.editionAccount, null);
  t.same(fetchedNft?.originalEdition, null);
  t.same(fetchedNft?.printEdition, null);
});
