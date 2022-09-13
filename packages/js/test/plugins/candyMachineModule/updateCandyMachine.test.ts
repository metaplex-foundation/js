import {
  CandyMachine,
  CandyMachineProgram,
  DefaultCandyGuardProgram,
  emptyDefaultCandyGuardSettings,
  findCandyGuardPda,
  sol,
  toBigNumber,
  toDateTime,
} from '@/index';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import {
  createCollectionNft,
  createWallet,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { create32BitsHash, createCandyMachine } from './helpers';

killStuckProcess();

test.only('[candyMachineModule] it can update the data of a candy machine', async (t) => {
  // Given a Candy Machine with the following data.
  const mx = await metaplex();
  const creatorA = Keypair.generate().publicKey;
  const candyMachine = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1000),
    symbol: 'OLD',
    sellerFeeBasisPoints: 100,
    maxEditionSupply: toBigNumber(1),
    isMutable: true,
    creators: [{ address: creatorA, share: 100 }],
    itemSettings: {
      type: 'configLines',
      prefixName: 'My Old NFT #',
      nameLength: 4,
      prefixUri: 'https://arweave.net/',
      uriLength: 50,
      isSequential: true,
    },
  });

  // When we update its data.
  const creatorB = Keypair.generate().publicKey;
  await mx
    .candyMachines()
    .update({
      candyMachine,
      itemsAvailable: toBigNumber(1000), // Cannot be updated.
      symbol: 'NEW',
      sellerFeeBasisPoints: 200,
      maxEditionSupply: toBigNumber(2),
      isMutable: false,
      creators: [{ address: creatorB, share: 100 }],
      itemSettings: {
        type: 'configLines',
        prefixName: 'My Old NFT #$ID+1$',
        nameLength: 0,
        prefixUri: 'https://my.app.com/nfts/$ID+1$',
        uriLength: 0,
        isSequential: false,
      },
    })
    .run();

  // Then the Candy Machine's data was updated accordingly.
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();
  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    address: spokSamePubkey(candyMachine.address),
    authorityAddress: spokSamePubkey(candyMachine.authorityAddress),
    mintAuthorityAddress: spokSamePubkey(candyMachine.mintAuthorityAddress),
    collectionMintAddress: spokSamePubkey(candyMachine.collectionMintAddress),
    symbol: 'NEW',
    sellerFeeBasisPoints: 200,
    isMutable: false,
    maxEditionSupply: spokSameBignum(2),
    creators: [{ address: spokSamePubkey(creatorB), share: 100 }],
    items: [],
    itemsAvailable: spokSameBignum(1000),
    itemsMinted: spokSameBignum(0),
    itemsRemaining: spokSameBignum(1000),
    itemsLoaded: 0,
    isFullyLoaded: false,
    itemSettings: {
      type: 'configLines',
      prefixName: 'My Old NFT #$ID+1$',
      nameLength: 0,
      prefixUri: 'https://my.app.com/nfts/$ID+1$',
      uriLength: 0,
      isSequential: false,
    },
    candyGuard: {
      model: 'candyGuard',
      address: spokSamePubkey(candyMachine.candyGuard?.address),
    },
  } as unknown as Specifications<CandyMachine>);
});

// it can update the hidden settings of a candy machine?

test.skip('[candyMachineModule] updating part of the data does not override the rest of it', async (t) => {
  //
});

test.skip('[candyMachineModule] it fails when the provided data to update misses properties', async (t) => {
  //
});

test.skip('[candyMachineModule] it can update the authorities of a candy machine', async (t) => {
  //
});

test.skip('[candyMachineModule] updating one authority does not override the other', async (t) => {
  //
});

test.skip('[candyMachineModule] it fails when the provided authorities to update miss properties', async (t) => {
  //
});

test.skip('[candyMachineModule] it can update the collection of a candy machine', async (t) => {
  //
});

test.skip('[candyMachineModule] it can update the collection of a candy machine when passed as a public key', async (t) => {
  //
});

test.skip('[candyMachineModule] it can update the guards of a candy machine', async (t) => {
  //
});

test.skip('[candyMachineModule] it can update the guards of a candy machine when passed as a public key', async (t) => {
  //
});

test.skip('[candyMachineModule] it fails when the provided guards to update miss properties', async (t) => {
  //
});

test.skip('[candyMachineModule] it fails when there is nothing to update', async (t) => {
  //
});

test.skip('[candyMachineModule] it can update data, authorities, collection and guards at the same time', async (t) => {
  //
});
