import { TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { sha512 } from '@noble/hashes/sha512';
import spok, { Specifications } from 'spok';
import { Test } from 'tape';
import {
  createCollectionNft,
  amman,
} from '../../js-plugin-nft-module/test/helpers';

import {
  CandyMachine,
  CandyMachineConfigLineSettings,
  CandyMachineItem,
  CreateCandyGuardInput,
  CreateCandyMachineInput,
} from '../src';

import {
  isSigner,
  Metaplex,
  PublicKey,
  toBigNumber,
  token,
} from '@metaplex-foundation/js-core';
import { NftWithToken } from '@metaplex-foundation/js-plugin-nft-module';
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
import { replaceCandyMachineItemPattern } from '../src/models/CandyMachineHiddenSection';
import test from 'tape';
import {
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../js-core/test/helpers/asserts';
export * from '../../js-core/test/helpers/asserts';

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

export const SEQUENTIAL_ITEM_SETTINGS: CandyMachineConfigLineSettings = {
  type: 'configLines',
  prefixName: '',
  nameLength: 32,
  prefixUri: '',
  uriLength: 200,
  isSequential: true,
};

export const createCandyMachine = async (
  metaplex: Metaplex,
  input?: Partial<CreateCandyMachineInput> & {
    items?: Pick<CandyMachineItem, 'name' | 'uri'>[];
  }
) => {
  let collection;
  if (input?.collection) {
    collection = input.collection;
  } else {
    const nft = await createCollectionNft(metaplex);
    collection = { address: nft.address, updateAuthority: metaplex.identity() };
  }

  let { candyMachine } = await metaplex.candyMachines().create({
    collection,
    sellerFeeBasisPoints: 200,
    itemsAvailable: toBigNumber(1000),
    ...input,
  });

  if (input?.items) {
    await metaplex.candyMachines().insertItems({
      candyMachine,
      authority:
        input.authority && isSigner(input.authority)
          ? input.authority
          : metaplex.identity(),
      items: input.items,
    });
    candyMachine = await metaplex.candyMachines().refresh(candyMachine);
  }

  return { candyMachine, collection };
};

export const createCandyGuard = async (
  metaplex: Metaplex,
  input?: Partial<CreateCandyGuardInput>
) => {
  const { candyGuard } = await metaplex
    .candyMachines()
    .createCandyGuard({ guards: {}, ...input });

  return candyGuard;
};

export function create32BitsHash(
  input: Buffer | string,
  slice?: number
): number[] {
  const hash = create32BitsHashString(input, slice);

  return Buffer.from(hash, 'utf8').toJSON().data;
}

export function create32BitsHashString(
  input: Buffer | string,
  slice = 32
): string {
  const hash = sha512(input).slice(0, slice / 2);

  return Buffer.from(hash).toString('hex');
}

export const assertMintingWasSuccessful = async (
  t: Test,
  metaplex: Metaplex,
  input: {
    candyMachine: CandyMachine;
    collectionUpdateAuthority: PublicKey;
    nft: NftWithToken;
    owner: PublicKey;
    mintedIndex?: number;
  }
) => {
  const { candyMachine } = input;
  const mintedIndex = input.mintedIndex ?? candyMachine.itemsMinted.toNumber();

  let expectedName: string;
  let expectedUri: string;
  if (candyMachine.itemSettings.type === 'hidden') {
    expectedName = replaceCandyMachineItemPattern(
      candyMachine.itemSettings.name,
      mintedIndex
    );
    expectedUri = replaceCandyMachineItemPattern(
      candyMachine.itemSettings.uri,
      mintedIndex
    );
  } else {
    const expectedItemMinted = candyMachine.items[mintedIndex];
    expectedName = expectedItemMinted.name;
    expectedUri = expectedItemMinted.uri;
  }

  // Then an NFT was created with the right data.
  spok(t, input.nft, {
    $topic: 'Minted NFT',
    model: 'nft',
    name: expectedName,
    uri: expectedUri,
    symbol: candyMachine.symbol,
    sellerFeeBasisPoints: candyMachine.sellerFeeBasisPoints,
    tokenStandard: TokenStandard.NonFungible,
    isMutable: candyMachine.isMutable,
    primarySaleHappened: true,
    updateAuthorityAddress: spokSamePubkey(input.collectionUpdateAuthority),
    creators: [
      {
        address: spokSamePubkey(
          metaplex.candyMachines().pdas().authority({
            candyMachine: candyMachine.address,
          })
        ),
        verified: true,
        share: 0,
      },
      ...candyMachine.creators.map((creator) => ({
        address: spokSamePubkey(creator.address),
        verified: false,
        share: creator.share,
      })),
    ],
    edition: {
      model: 'nftEdition',
      isOriginal: true,
      supply: spokSameBignum(toBigNumber(0)),
      maxSupply: spokSameBignum(candyMachine.maxEditionSupply),
    },
    token: {
      model: 'token',
      ownerAddress: spokSamePubkey(input.owner),
      mintAddress: spokSamePubkey(input.nft.address),
      amount: spokSameAmount(token(1, 0, candyMachine.symbol || 'Token')),
    },
  } as Specifications<NftWithToken>);

  // And the Candy Machine data was updated.
  const expectedMinted = candyMachine.itemsMinted.addn(1);
  const expectedRemaining = candyMachine.itemsAvailable.sub(expectedMinted);
  const updatedCandyMachine = await metaplex
    .candyMachines()
    .refresh(candyMachine);
  spok(t, updatedCandyMachine, {
    $topic: 'Update Candy Machine',
    itemsAvailable: spokSameBignum(candyMachine.itemsAvailable),
    itemsMinted: spokSameBignum(expectedMinted),
    itemsRemaining: spokSameBignum(expectedRemaining),
  } as Specifications<CandyMachine>);

  if (candyMachine.itemSettings.type === 'configLines') {
    t.true(
      updatedCandyMachine.items[mintedIndex].minted,
      'Item was marked as minted'
    );
  }
};

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
