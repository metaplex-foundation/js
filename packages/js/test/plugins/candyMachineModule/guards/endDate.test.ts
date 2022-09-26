import { isEqualToAmount, now, sol, toBigNumber, toDateTime } from '@/index';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';

killStuckProcess();

const SECONDS_IN_A_DAY = 24 * 60 * 60;

test.skip('[candyMachineModule] endDate guard: it allows TODO', async (t) => {
  // Given a loaded Candy Machine with TODO.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      endDate: {
        date: toDateTime(now().addn(SECONDS_IN_A_DAY)), // Tomorrow.
      },
    },
  });

  // When we mint from it.
  const payer = await createWallet(mx, 10);
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });
});

test.skip('[candyMachineModule] endDate guard: it forbids TODO', async (t) => {
  //
});

test.skip('[candyMachineModule] endDate guard with bot tax: it charges a bot tax when trying to TODO', async (t) => {
  // TODO
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const promise = (async () => {})();

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /Candy Machine Bot Tax/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});
