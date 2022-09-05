import { sol, toDateTime } from '@/index';
import { findCandyGuardPda } from '@/plugins/candyGuardModule';
import { emptyDefaultCandyGuardSettings } from '@/plugins/candyGuardModule/guards';
import spok from 'spok';
import test from 'tape';
import { killStuckProcess, metaplex, spokSamePubkey } from '../../helpers';

killStuckProcess();

test('[candyGuardModule] create with no guards', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with no guards.
  const { candyGuard, base } = await mx
    .candyGuards()
    .create({ guards: emptyDefaultCandyGuardSettings })
    .run();

  // Then we expect the Candy Guard account to exists with the following data.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    address: spokSamePubkey(findCandyGuardPda(base.publicKey)),
    baseAddress: spokSamePubkey(base.publicKey),
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    accountInfo: {
      executable: false,
      owner: spokSamePubkey(mx.programs().get('CandyGuardProgram').address),
    },
    guards: emptyDefaultCandyGuardSettings,
    groups: [],
  });
});

test.only('[candyGuardModule] create with all guards', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with no guards.
  const { candyGuard } = await mx
    .candyGuards()
    .create({
      guards: {
        botTax: {
          lamports: sol(0.01),
          lastInstruction: false,
        },
        liveDate: {
          date: toDateTime('2022-09-05T20:00:00.000Z'),
        },
        lamports: {
          amount: sol(1.5),
        },
        splToken: null,
        thirdPartySigner: null,
        whitelist: null,
        gatekeeper: null,
        endSettings: null,
        allowList: null,
        mintLimit: null,
      },
    })
    .run();

  // Then we expect the Candy Guard account to exists with the following data.
  spok(t, candyGuard, {
    $topic: 'Candy Guard',
    model: 'candyGuard',
    // guards: emptyDefaultCandyGuardSettings,
    groups: [],
  });
  console.log(candyGuard);
});
