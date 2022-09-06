import {
  CandyGuard,
  DefaultCandyGuardSettings,
  emptyDefaultCandyGuardSettings,
  sol,
  toDateTime,
  token,
} from '@/index';
import { EndSettingType } from '@metaplex-foundation/mpl-candy-guard';
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
  const updatedCandyGuard = await mx.candyGuards().refresh(candyGuard).run();
  spok(t, updatedCandyGuard, {
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

test('[candyGuardModule] it overrides all previous guards', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing Candy Guard with a few enabled guards.
  const candyGuard = await createCandyGuard(mx, {
    guards: {
      liveDate: { date: toDateTime('2022-09-06T10:00:00.000Z') },
      lamports: { amount: sol(1) },
    },
  });

  // When we update the Candy Guard with a new set of guards.
  await mx
    .candyGuards()
    .update({
      candyGuard: candyGuard.address,
      guards: {
        lamports: { amount: sol(2) },
        botTax: { lamports: sol(0.01), lastInstruction: true },
      },
      groups: [],
    })
    .run();

  // Then all previous guards were overridden.
  const updatedCandyGuard = await mx.candyGuards().refresh(candyGuard).run();
  spok(t, updatedCandyGuard, {
    $topic: 'Updated Candy Guard',
    model: 'candyGuard',
    address: spokSamePubkey(candyGuard.address),
    guards: {
      ...emptyDefaultCandyGuardSettings,
      liveDate: null,
      lamports: { amount: spokSameAmount(sol(2)) },
      botTax: { lamports: spokSameAmount(sol(0.01)), lastInstruction: true },
    },
    groups: [],
  } as unknown as Specifications<CandyGuard<DefaultCandyGuardSettings>>);
});

test('[candyGuardModule] it can update groups', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing Candy Guard with one group.
  const candyGuard = await createCandyGuard(mx, {
    guards: {},
    groups: [
      {
        liveDate: { date: toDateTime('2022-09-06T10:00:00.000Z') },
      },
    ],
  });

  // When we update the guards of the only Candy Guard's group.
  await mx
    .candyGuards()
    .update({
      candyGuard: candyGuard.address,
      guards: {},
      groups: [
        {
          liveDate: { date: toDateTime('2022-09-06T12:00:00.000Z') },
        },
      ],
    })
    .run();

  // Then the updated Candy Guard has the expected data.
  const updatedCandyGuard = await mx.candyGuards().refresh(candyGuard).run();
  spok(t, updatedCandyGuard, {
    $topic: 'Updated Candy Guard',
    model: 'candyGuard',
    address: spokSamePubkey(candyGuard.address),
    guards: emptyDefaultCandyGuardSettings,
    groups: [
      {
        ...emptyDefaultCandyGuardSettings,
        liveDate: {
          date: spokSameBignum(toDateTime('2022-09-06T12:00:00.000Z')),
        },
      },
    ],
  } as unknown as Specifications<CandyGuard<DefaultCandyGuardSettings>>);
});

test('[candyGuardModule] it overrides all previous groups', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing Candy Guard with three groups.
  const splTokenA = Keypair.generate().publicKey;
  const candyGuard = await createCandyGuard(mx, {
    guards: {},
    groups: [
      {
        liveDate: { date: null },
        lamports: { amount: sol(1) },
      },
      {
        liveDate: { date: toDateTime('2022-09-06T12:00:00.000Z') },
        splToken: { tokenMint: splTokenA, amount: token(375) },
      },
      {
        liveDate: { date: toDateTime('2022-09-06T13:00:00.000Z') },
        lamports: { amount: sol(2) },
      },
    ],
  });

  // When we update the candy guard's groups.
  const splTokenB = Keypair.generate().publicKey;
  await mx
    .candyGuards()
    .update({
      candyGuard: candyGuard.address,
      guards: {},
      groups: [
        {
          liveDate: { date: null },
          lamports: { amount: sol(2) },
        },
        {
          liveDate: { date: toDateTime('2022-09-06T12:00:00.000Z') },
          splToken: { tokenMint: splTokenB, amount: token(42) },
        },
      ],
    })
    .run();

  // Then all previous groups were overridden.
  const updatedCandyGuard = await mx.candyGuards().refresh(candyGuard).run();
  spok(t, updatedCandyGuard, {
    $topic: 'Updated Candy Guard',
    model: 'candyGuard',
    address: spokSamePubkey(candyGuard.address),
    guards: emptyDefaultCandyGuardSettings,
    groups: [
      {
        ...emptyDefaultCandyGuardSettings,
        liveDate: { date: null },
        lamports: { amount: spokSameAmount(sol(2)) },
      },
      {
        ...emptyDefaultCandyGuardSettings,
        liveDate: {
          date: spokSameBignum(toDateTime('2022-09-06T12:00:00.000Z')),
        },
        splToken: {
          tokenMint: spokSamePubkey(splTokenB),
          amount: spokSameAmount(token(42)),
        },
      },
    ],
  } as unknown as Specifications<CandyGuard<DefaultCandyGuardSettings>>);
});

test('[candyGuardModule] it can remove all guards and groups', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing Candy Guard with three groups and some default guards.
  const splTokenA = Keypair.generate().publicKey;
  const candyGuard = await createCandyGuard(mx, {
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
      endSettings: {
        endSettingType: EndSettingType.Date,
        date: toDateTime('2022-09-06T10:00:00.000Z'),
      },
    },
    groups: [
      {
        liveDate: { date: null },
        lamports: { amount: sol(1) },
      },
      {
        liveDate: { date: toDateTime('2022-09-06T12:00:00.000Z') },
        splToken: { tokenMint: splTokenA, amount: token(375) },
      },
      {
        liveDate: { date: toDateTime('2022-09-06T13:00:00.000Z') },
        lamports: { amount: sol(2) },
      },
    ],
  });

  // When we update the candy guard with no guards and no groups.
  await mx
    .candyGuards()
    .update({
      candyGuard: candyGuard.address,
      guards: {},
      groups: [],
    })
    .run();

  // Then all groups and default guards were removed.
  const updatedCandyGuard = await mx.candyGuards().refresh(candyGuard).run();
  spok(t, updatedCandyGuard, {
    $topic: 'Updated Candy Guard',
    model: 'candyGuard',
    address: spokSamePubkey(candyGuard.address),
    guards: emptyDefaultCandyGuardSettings,
    groups: [],
  } as unknown as Specifications<CandyGuard<DefaultCandyGuardSettings>>);
});
