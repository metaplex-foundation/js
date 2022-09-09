import {
  CandyGuard,
  CandyMachine,
  CandyMachineProgram,
  DefaultCandyGuardProgram,
  DefaultCandyGuardSettings,
  emptyDefaultCandyGuardSettings,
  findCandyGuardPda,
  sol,
  toBigNumber,
  toDateTime,
  token,
} from '@/index';
import {
  EndSettingType,
  WhitelistTokenMode,
} from '@metaplex-foundation/mpl-candy-guard';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import {
  createCollectionNft,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';

killStuckProcess();

test.only('[candyMachineModule] create with minimum configuration', async (t) => {
  // Given an existing Collection NFT.
  const mx = await metaplex();
  const collectionNft = await createCollectionNft(mx);

  // When we create a new Candy Machine with minimum configuration.
  const { candyMachine, candyMachineSigner } = await mx
    .candyMachines()
    .create({
      itemsAvailable: toBigNumber(5000),
      sellerFeeBasisPoints: 333, // 3.33%
      collection: collectionNft,
    })
    .run();

  // Then the following data was set on the Candy Machine account.
  const candyGuardAddress = findCandyGuardPda(candyMachineSigner.publicKey);
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    accountInfo: {
      owner: spokSamePubkey(CandyMachineProgram.address),
    },
    address: spokSamePubkey(candyMachineSigner.publicKey),
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    mintAuthorityAddress: spokSamePubkey(candyGuardAddress),
    collectionMintAddress: spokSamePubkey(collectionNft.address),
    symbol: '',
    sellerFeeBasisPoints: 333,
    isMutable: true,
    maxEditionSupply: spokSameBignum(0),
    creators: [
      {
        address: spokSamePubkey(mx.identity().publicKey),
        share: 100,
      },
    ],
    items: [],
    itemsAvailable: spokSameBignum(5000),
    itemsMinted: spokSameBignum(0),
    itemsRemaining: spokSameBignum(5000),
    itemsLoaded: 0,
    isFullyLoaded: false,
    itemSettings: {
      type: 'configLines',
      prefixName: '',
      nameLength: 32,
      prefixUri: '',
      uriLength: 200,
      isSequential: false,
    },
    candyGuard: {
      model: 'candyGuard',
      accountInfo: {
        owner: spokSamePubkey(DefaultCandyGuardProgram.address),
      },
      address: spokSamePubkey(candyGuardAddress),
      baseAddress: spokSamePubkey(candyMachineSigner.publicKey),
      authorityAddress: spokSamePubkey(mx.identity().publicKey),
      guards: emptyDefaultCandyGuardSettings,
      groups: [],
    },
  } as unknown as Specifications<CandyMachine>);
  t.equal(candyMachine.itemsLoadedMap.length, 5000);
  t.ok(candyMachine.itemsLoadedMap.every((loaded) => !loaded));
  t.equal(candyMachine.featureFlags.length, 64);
  t.ok(candyMachine.featureFlags.slice(0, 64).every((enabled) => !enabled));
});

test.skip('[candyMachineModule] create with maximum configuration', async (t) => {
  //
});

test.skip('[candyMachineModule] create without a candy guard', async (t) => {
  //
});

test.skip('[candyMachineModule] create with hidden settings', async (t) => {
  //
});
