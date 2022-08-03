import { Test } from 'tape';
import { Metaplex, Nft } from '@/index';

export const assertCollectionHasSize = (
  t: Test,
  collectionNft: Nft,
  expectedSize: number
) => {
  t.equal(
    collectionNft.collectionDetails?.size?.toNumber(),
    expectedSize,
    `collection NFT has the expected size: ${expectedSize}`
  );
};

export const assertRefreshedCollectionHasSize = async (
  t: Test,
  mx: Metaplex,
  collectionNft: Nft,
  expectedSize: number
) => {
  const updateCollectionNft = await mx.nfts().refresh(collectionNft).run();
  assertCollectionHasSize(t, updateCollectionNft, expectedSize);
};
