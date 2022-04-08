import test, { Test } from 'tape';
import { metaplex, createNft } from 'test/helpers';

test('it can fetch all NFTs from a provided mint list', async (t: Test) => {
  // Given a metaplex instance and two NFTs on-chain.
  const mx = await metaplex();
  const nftA = await createNft(mx, { name: 'NFT A' });
  const nftB = await createNft(mx, { name: 'NFT B' });

  // When we fetch these NFTs by mint addresses.
  const nfts = await mx.nfts().findNftsByMintList([nftA.mint, nftB.mint]);

  // Then we get the right NFTs.
  t.same(nfts.map(nft => nft.name), ['NFT A', 'NFT B']);
  t.true(nfts[0].is(nftA));
  t.true(nfts[1].is(nftB));
});

test('it does not load the NFT metadata or master edition by default', async (t: Test) => {
  // Given a metaplex instance and a connected wallet with one nft.
  const mx = await metaplex();
  const nft = await createNft(mx, { name: 'Some NFT' });

  // When we fetch all NFTs in the wallet.
  const [fetchedNft] = await mx.nfts().findNftsByMintList([nft.mint]);

  // Then the fetched NFTs do not have metadata.
  t.false(fetchedNft.metadataLoader.isLoading());
  t.false(fetchedNft.metadataLoader.isLoaded());
  t.same(fetchedNft.metadata, {});

  // Nor does it have a loaded master edition.
  t.false(fetchedNft.masterEditionLoader.isLoading());
  t.false(fetchedNft.masterEditionLoader.isLoaded());
  t.equal(fetchedNft.masterEditionAccount, null);
  t.same(fetchedNft.masterEdition, {});
});
