import {
  CandyGuard,
  DefaultCandyGuardSettings,
  emptyDefaultCandyGuardSettings,
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
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { createCandyGuard } from './helpers';

killStuckProcess();

test('[candyGuardModule] it can update one guard', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing Candy Guard with one guard.
  const candyGuard = await createCandyGuard(mx, {
    guards: {
      liveDate: { date: toDateTime('2022-09-06T10:00:00.000Z') },
    },
  });

  // When we update the Candy Guard's only guard.
  await mx
    .candyGuards()
    .update({
      candyGuard: candyGuard.address,
      guards: {
        liveDate: { date: toDateTime('2022-09-06T12:00:00.000Z') },
      },
      groups: [],
    })
    .run();

  // Then the updated Candy Guard has the expected data.
  spok(t, candyGuard, {
    $topic: 'Updated Candy Guard',
    model: 'candyGuard',
    address: spokSamePubkey(candyGuard.address),
    guards: {
      ...emptyDefaultCandyGuardSettings,
      liveDate: {
        date: spokSameBignum(toDateTime('2022-09-06T12:00:00.000Z')),
      },
    },
    groups: [],
  } as unknown as Specifications<CandyGuard<DefaultCandyGuardSettings>>);
});

test.skip('[candyGuardModule] it overrides all previous guards', async (t) => {
  // ...
});

test.skip('[candyGuardModule] it can update groups', async (t) => {
  // ...
});

test.skip('[candyGuardModule] it overrides all previous groups', async (t) => {
  // ...
});

test.skip('[candyGuardModule] it can remove all guards and groups', async (t) => {
  // ...
});
