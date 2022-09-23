import { isEqualToAmount, now, sol, toBigNumber, toDateTime } from '@/index';
import { Keypair } from '@solana/web3.js';
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

test('[candyMachineModule] liveDate guard: it allows minting after the live date', async (t) => {
  // Given a loaded Candy Machine with a live date in the past.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      liveDate: {
        date: toDateTime(now().subn(SECONDS_IN_A_DAY)), // Yesterday.
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
    owner: mx.identity().publicKey,
  });
});

test('[candyMachineModule] liveDate guard: it forbids minting before the live date', async (t) => {
  // Given a loaded Candy Machine with a live date in the future.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      liveDate: {
        date: toDateTime(now().addn(SECONDS_IN_A_DAY)), // Tomorrow.
      },
    },
  });

  // When we try to mint from it.
  const payer = await createWallet(mx, 10);
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Mint is not live/);
});

test('[candyMachineModule] liveDate guard with bot tax: it charges a bot tax when trying to mint before the live date', async (t) => {
  // Given a loaded Candy Machine with a live date in the future and a bot tax.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      liveDate: {
        date: toDateTime(now().addn(SECONDS_IN_A_DAY)), // Tomorrow.
      },
    },
  });

  // When we try to mint from it.
  const payer = await createWallet(mx, 10);
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
    })
    .run();

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /Candy Machine Bot Tax/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});
