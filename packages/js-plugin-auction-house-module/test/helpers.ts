import { Metaplex } from '@metaplex-foundation/js-core';
import { sol, Signer } from '@metaplex-foundation/js-core';
import { Test } from 'tape';
import { CreateAuctionHouseInput } from '../src';
import test from 'tape';

import { Amman } from '@metaplex-foundation/amman-client';
import { logDebug } from '@metaplex-foundation/js-core';
import {
  CreateNftInput,
  Nft,
  UploadMetadataInput,
} from '@metaplex-foundation/js-plugin-nft-module';
import { Commitment, Connection, Keypair } from '@solana/web3.js';
import {
  KeypairSigner,
  guestIdentity,
  mockStorage,
  keypairIdentity,
  programModule,
  operationModule,
  rpcModule,
  utilsModule,
  systemModule,
} from '@metaplex-foundation/js-core';

import { LOCALHOST } from '@metaplex-foundation/amman-client';
import { tokenModule } from '@metaplex-foundation/js-plugin-token-module';
export * from '../../js-core/test/helpers/asserts';

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

export const createAuctionHouse = async (
  mx: Metaplex,
  auctioneerAuthority?: Signer | null,
  input: Partial<CreateAuctionHouseInput> = {}
) => {
  const { auctionHouse } = await mx.auctionHouse().create({
    sellerFeeBasisPoints: 200,
    auctioneerAuthority: auctioneerAuthority?.publicKey,
    ...input,
  });

  await mx.rpc().airdrop(auctionHouse.feeAccountAddress, sol(100));

  return auctionHouse;
};

export const metaplexGuest = (options: MetaplexTestOptions = {}) => {
  const connection = new Connection(options.rpcEndpoint ?? LOCALHOST, {
    commitment: options.commitment ?? 'confirmed',
  });

  return (
    Metaplex.make(connection)
      .use(guestIdentity())
      .use(mockStorage())
      .use(rpcModule())
      .use(operationModule())
      .use(programModule())
      .use(utilsModule())
      .use(tokenModule())

      // Default drivers.
      .use(guestIdentity())

      // Verticals.
      .use(systemModule())
  );
};

export const metaplex = async (options: MetaplexTestOptions = {}) => {
  const mx = metaplexGuest(options);

  const wallet = await createWallet(mx, options.solsToAirdrop);

  return mx.use(keypairIdentity(wallet as Keypair));
};

export type MetaplexTestOptions = {
  rpcEndpoint?: string;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
  solsToAirdrop?: number;
};

export const createWallet = async (
  mx: Metaplex,
  solsToAirdrop: number = 100
): Promise<KeypairSigner> => {
  const wallet = Keypair.generate();
  await amman.airdrop(mx.connection, wallet.publicKey, solsToAirdrop);

  return wallet;
};
