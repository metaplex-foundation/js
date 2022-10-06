import { Test } from 'tape';
import { Metaplex } from '@metaplex-foundation/js-core';
import { CreateNftInput, Nft, UploadMetadataInput } from '../src';

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

export const createNft = async (
  mx: Metaplex,
  input: Partial<CreateNftInput & { json: UploadMetadataInput }> = {}
) => {
  const { uri } = await mx
    .nfts()
    .uploadMetadata(input.json ?? {})
    .run();

  const { nft } = await mx
    .nfts()
    .create({
      uri,
      name: 'My NFT',
      sellerFeeBasisPoints: 200,
      ...input,
    })
    .run();

  return nft;
};

export const createCollectionNft = (
  mx: Metaplex,
  input: Partial<CreateNftInput & { json: UploadMetadataInput }> = {}
) => createNft(mx, { ...input, isCollection: true });
