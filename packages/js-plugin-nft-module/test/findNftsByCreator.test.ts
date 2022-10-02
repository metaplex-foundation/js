import { Metaplex, Metadata } from '@/index';
import { Keypair, PublicKey } from '@solana/web3.js';
import test, { Test } from 'tape';
import { metaplex, createNft, killStuckProcess } from '../../helpers';

killStuckProcess();

test('[nftModule] it can fetch all NFTs from the first creator', async (t: Test) => {
  // Given a metaplex instance and two NFTs from two different creators.
  const mx = await metaplex();
  const creatorA = Keypair.generate().publicKey;
  const creatorB = Keypair.generate().publicKey;
  const nftA = await createNftWithFirstCreator(mx, 'NFT A', creatorA);
  const nftB = await createNftWithFirstCreator(mx, 'NFT B', creatorB);

  // When we fetch the NFTs by creator A.
  const nftsA = (await mx
    .nfts()
    .findAllByCreator({ creator: creatorA })
    .run()) as Metadata[];

  // Then we don't get the NFTs from creator B.
  t.same(
    nftsA.map((nft) => nft.name),
    ['NFT A']
  );
  t.same(nftsA[0].mintAddress, nftA.address);

  // And vice versa.
  const nftsB = (await mx
    .nfts()
    .findAllByCreator({ creator: creatorB })
    .run()) as Metadata[];
  t.same(
    nftsB.map((nft) => nft.name),
    ['NFT B']
  );
  t.same(nftsB[0].mintAddress, nftB.address);
});

test('[nftModule] it can fetch all NFTs from other creator positions', async (t: Test) => {
  // Given a metaplex instance and two NFTs from two different creators on the second position.
  const mx = await metaplex();
  const creatorA = Keypair.generate().publicKey;
  const creatorB = Keypair.generate().publicKey;
  const nftA = await createNftWithSecondCreator(mx, 'NFT A', creatorA);
  const nftB = await createNftWithSecondCreator(mx, 'NFT B', creatorB);

  // When we fetch the NFTs by second creator A.
  const nftsA = (await mx
    .nfts()
    .findAllByCreator({ creator: creatorA, position: 2 })
    .run()) as Metadata[];

  // Then we don't get the NFTs from second creator B.
  t.same(
    nftsA.map((nft) => nft.name),
    ['NFT A']
  );
  t.same(nftsA[0].mintAddress, nftA.address);

  // And vice versa.
  const nftsB = (await mx
    .nfts()
    .findAllByCreator({ creator: creatorB, position: 2 })
    .run()) as Metadata[];
  t.same(
    nftsB.map((nft) => nft.name),
    ['NFT B']
  );
  t.same(nftsB[0].mintAddress, nftB.address);
});

const createNftWithFirstCreator = (
  mx: Metaplex,
  name: string,
  creator: PublicKey
) => {
  return createNft(mx, {
    name,
    creators: [
      { address: creator, share: 50 },
      { address: mx.identity().publicKey, share: 50 },
    ],
  });
};

const createNftWithSecondCreator = (
  mx: Metaplex,
  name: string,
  creator: PublicKey
) => {
  return createNft(mx, {
    name,
    creators: [
      { address: mx.identity().publicKey, share: 50 },
      { address: creator, share: 50 },
    ],
  });
};
