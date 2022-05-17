import { Metaplex } from '@/Metaplex';
import { Keypair, PublicKey } from '@solana/web3.js';
import test, { Test } from 'tape';
import { metaplex, createNft, killStuckProcess } from 'test/helpers';

killStuckProcess();

test('it can fetch all NFTs from the first creator', async (t: Test) => {
  // Given a metaplex instance and two NFTs from two different creators.
  const mx = await metaplex();
  const creatorA = Keypair.generate().publicKey;
  const creatorB = Keypair.generate().publicKey;
  const nftA = await createNftWithFirstCreator(mx, 'NFT A', creatorA);
  const nftB = await createNftWithFirstCreator(mx, 'NFT B', creatorB);

  // When we fetch the NFTs by creator A.
  const nftsA = await mx.nfts().findAllByCreator(creatorA);

  // Then we don't get the NFTs from creator B.
  t.same(
    nftsA.map((nft) => nft.name),
    ['NFT A']
  );
  t.true(nftsA[0].equals(nftA));

  // And vice versa.
  const nftsB = await mx.nfts().findAllByCreator(creatorB);
  t.same(
    nftsB.map((nft) => nft.name),
    ['NFT B']
  );
  t.true(nftsB[0].equals(nftB));
});

test('it can fetch all NFTs from other creator positions', async (t: Test) => {
  // Given a metaplex instance and two NFTs from two different creators on the second position.
  const mx = await metaplex();
  const creatorA = Keypair.generate().publicKey;
  const creatorB = Keypair.generate().publicKey;
  const nftA = await createNftWithSecondCreator(mx, 'NFT A', creatorA);
  const nftB = await createNftWithSecondCreator(mx, 'NFT B', creatorB);

  // When we fetch the NFTs by second creator A.
  const nftsA = await mx.nfts().findAllByCreator(creatorA, 2);

  // Then we don't get the NFTs from second creator B.
  t.same(
    nftsA.map((nft) => nft.name),
    ['NFT A']
  );
  t.true(nftsA[0].equals(nftA));

  // And vice versa.
  const nftsB = await mx.nfts().findAllByCreator(creatorB, 2);
  t.same(
    nftsB.map((nft) => nft.name),
    ['NFT B']
  );
  t.true(nftsB[0].equals(nftB));
});

const createNftWithFirstCreator = (
  mx: Metaplex,
  name: string,
  creator: PublicKey
) => {
  return createNft(
    mx,
    { name },
    {
      creators: [
        { address: creator, share: 50, verified: false },
        { address: mx.identity().publicKey, share: 50, verified: true },
      ],
    }
  );
};

const createNftWithSecondCreator = (
  mx: Metaplex,
  name: string,
  creator: PublicKey
) => {
  return createNft(
    mx,
    { name },
    {
      creators: [
        { address: mx.identity().publicKey, share: 50, verified: true },
        { address: creator, share: 50, verified: false },
      ],
    }
  );
};
