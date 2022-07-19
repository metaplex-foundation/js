import { Metaplex } from '@/Metaplex';
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
  const nftsA = await mx.nfts().findAllByCreator(creatorA).run();

  // Then we don't get the NFTs from creator B.
  t.same(
    nftsA.map((nft) => nft.name),
    ['NFT A']
  );
  t.same(nftsA[0].mintAddress, nftA.mintAddress);

  // And vice versa.
  const nftsB = await mx.nfts().findAllByCreator(creatorB).run();
  t.same(
    nftsB.map((nft) => nft.name),
    ['NFT B']
  );
  t.same(nftsB[0].mintAddress, nftB.mintAddress);
});

test('[nftModule] it can fetch all NFTs from other creator positions', async (t: Test) => {
  // Given a metaplex instance and two NFTs from two different creators on the second position.
  const mx = await metaplex();
  const creatorA = Keypair.generate().publicKey;
  const creatorB = Keypair.generate().publicKey;
  const nftA = await createNftWithSecondCreator(mx, 'NFT A', creatorA);
  const nftB = await createNftWithSecondCreator(mx, 'NFT B', creatorB);

  // When we fetch the NFTs by second creator A.
  const nftsA = await mx
    .nfts()
    .findAllByCreator(creatorA, { position: 2 })
    .run();

  // Then we don't get the NFTs from second creator B.
  t.same(
    nftsA.map((nft) => nft.name),
    ['NFT A']
  );
  t.same(nftsA[0].mintAddress, nftA.mintAddress);

  // And vice versa.
  const nftsB = await mx
    .nfts()
    .findAllByCreator(creatorB, { position: 2 })
    .run();
  t.same(
    nftsB.map((nft) => nft.name),
    ['NFT B']
  );
  t.same(nftsB[0].mintAddress, nftB.mintAddress);
});

const createNftWithFirstCreator = (
  mx: Metaplex,
  name: string,
  creator: PublicKey
) => {
  return createNft(
    mx,
    {},
    {
      name,
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
    {},
    {
      name,
      creators: [
        { address: mx.identity().publicKey, share: 50, verified: true },
        { address: creator, share: 50, verified: false },
      ],
    }
  );
};
