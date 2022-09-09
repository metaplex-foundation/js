import {
  CandyGuard,
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
  spok(t, candyMachine, {
    $topic: 'Candy Machine',
    model: 'candyMachine',
    address: spokSamePubkey(candyMachineSigner.publicKey),
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    accountInfo: {
      executable: false,
      owner: spokSamePubkey(mx.programs().get('CandyMachineProgram').address),
    },
  });
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
