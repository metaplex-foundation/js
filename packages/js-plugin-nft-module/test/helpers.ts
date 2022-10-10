import { Test } from 'tape';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import { CreateNftInput, Nft, UploadMetadataInput } from '../src';
import test from 'tape';

import { Amman } from '@metaplex-foundation/amman-client';
import { logDebug } from '@metaplex-foundation/js-core';

export const amman = Amman.instance({ log: logDebug });

/**
 * This is a workaround the fact that web3.js doesn't close it's socket connection and provides no way to do so.
 * Therefore the process hangs for a considerable time after the tests finish, increasing the feedback loop.
 *
 * This fixes this by exiting the process as soon as all tests are finished.
 */
export function killStuckProcess() {
  // Don't do this in CI since we need to ensure we get a non-zero exit code if tests fail
  if (process.env.CI == null) {
    test.onFinish(() => process.exit(0));
  }
}

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
  const updateCollectionNft = await mx.nfts().refresh(collectionNft);
  assertCollectionHasSize(t, updateCollectionNft, expectedSize);
};

export const createNft = async (
  mx: Metaplex,
  input: Partial<CreateNftInput & { json: UploadMetadataInput }> = {}
) => {
  const { uri } = await mx.nfts().uploadMetadata(input.json ?? {});

  const { nft } = await mx.nfts().create({
    uri,
    name: 'My NFT',
    sellerFeeBasisPoints: 200,
    ...input,
  });

  return nft;
};

export const createCollectionNft = (
  mx: Metaplex,
  input: Partial<CreateNftInput & { json: UploadMetadataInput }> = {}
) => createNft(mx, { ...input, isCollection: true });
