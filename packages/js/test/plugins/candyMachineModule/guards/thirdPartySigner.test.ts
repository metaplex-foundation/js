import { isEqualToAmount, sol, toBigNumber } from '@/index';
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

test('[candyMachineModule] thirdPartySigner guard: it allows minting when the third party signer is provided', async (t) => {
  // Given a loaded Candy Machine with a third party signer guard.
  const mx = await metaplex();
  const thirdPartySigner = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      thirdPartySigner: {
        signerKey: thirdPartySigner.publicKey,
      },
    },
  });

  // When we mint from it by providing the third party as a Signer.
  const payer = await createWallet(mx, 10);
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        thirdPartySigner: {
          signer: thirdPartySigner,
        },
      },
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

test.skip('[candyMachineModule] thirdPartySigner guard: it forbids minting when the third party signer is wrong', async (t) => {
  //
});

test.skip('[candyMachineModule] thirdPartySigner guard with bot tax: it charges a bot tax when trying to mint using the wrong third party signer', async (t) => {
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

test('[candyMachineModule] thirdPartySigner guard: minting settings must be provided', async (t) => {
  // Given a loaded Candy Machine with a third party signer guard.
  const mx = await metaplex();
  const thirdPartySigner = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      thirdPartySigner: {
        signerKey: thirdPartySigner.publicKey,
      },
    },
  });

  // When we try to mint from it without providing the third party signer.
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
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[thirdPartySigner\] guard/
  );
});
