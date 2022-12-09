import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import { isEqualToAmount, now, sol, toBigNumber, toDateTime } from '@/index';

killStuckProcess();

const SECONDS_IN_A_DAY = 24 * 60 * 60;

test('[candyMachineModule] startDate guard: it allows minting after the start date', async (t) => {
  // Given a loaded Candy Machine with a start date in the past.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      startDate: {
        date: toDateTime(now().subn(SECONDS_IN_A_DAY)), // Yesterday.
      },
    },
  });

  // When we mint from it.
  const payer = await createWallet(mx, 10);
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });
});

test('[candyMachineModule] startDate guard: it forbids minting before the start date', async (t) => {
  // Given a loaded Candy Machine with a start date in the future.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      startDate: {
        date: toDateTime(now().addn(SECONDS_IN_A_DAY)), // Tomorrow.
      },
    },
  });

  // When we try to mint from it.
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Mint is not live/);
});

test('[candyMachineModule] startDate guard with bot tax: it charges a bot tax when trying to mint before the start date', async (t) => {
  // Given a loaded Candy Machine with a start date in the future and a bot tax.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      startDate: {
        date: toDateTime(now().addn(SECONDS_IN_A_DAY)), // Tomorrow.
      },
    },
  });

  // When we try to mint from it.
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /CandyMachineBotTaxError/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});
