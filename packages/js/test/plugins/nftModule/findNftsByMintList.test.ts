import { isLazyNft } from '@/plugins';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { metaplex, createNft, killStuckProcess } from 'test/helpers';

killStuckProcess();

test('[nftModule] it can fetch all NFTs from a provided mint list', async (t: Test) => {
  // Given a metaplex instance and two NFTs on-chain.
  const mx = await metaplex();
  const nftA = await createNft(mx, {}, { name: 'NFT A' });
  const nftB = await createNft(mx, {}, { name: 'NFT B' });

  // When we fetch these NFTs by mint addresses.
  const nfts = await mx
    .nfts()
    .findAllByMintList([nftA.mintAddress, nftB.mintAddress])
    .run();

  // Then we get the right NFTs.
  t.same(
    nfts.map((nft) => nft?.name),
    ['NFT A', 'NFT B']
  );
  t.same(nfts[0]?.mintAddress, nftA.mintAddress);
  t.same(nfts[1]?.mintAddress, nftB.mintAddress);
});

test('[nftModule] it returns null when an NFT is not found in a mint list', async (t: Test) => {
  // Given a metaplex instance and one NFT on-chain.
  const mx = await metaplex();
  const nft = await createNft(mx, {}, { name: 'Some NFT' });

  // And two mint addresses with no NFT associated to them.
  const emptyMintA = Keypair.generate().publicKey;
  const emptyMintB = Keypair.generate().publicKey;

  // When we fetch NFTs matching all these addresses.
  const nfts = await mx
    .nfts()
    .findAllByMintList([emptyMintA, nft.mintAddress, emptyMintB])
    .run();

  // Then we get null for mint not associated to any NFT.
  t.same(
    nfts.map((nft) => nft?.name ?? null),
    [null, 'Some NFT', null]
  );
});

test('[nftModule] it returns LazyNfts by default', async (t: Test) => {
  // Given a metaplex instance and an NFT on-chain.
  const mx = await metaplex();
  const nft = await createNft(mx, { name: 'Some NFT' });

  // When we fetch that NFT by providing an array of mint addresses.
  const [fetchedNft] = await mx
    .nfts()
    .findAllByMintList([nft.mintAddress])
    .run();

  // Then the fetched NFTs is a LazyNft.
  t.ok(isLazyNft(fetchedNft), 'is a lazy NFT');
});
