import { Test } from 'tape';
import { Metaplex } from '@metaplex-foundation/js/index';
import { Nft } from '@metaplex-foundation/js-plugin-nft-module';

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
