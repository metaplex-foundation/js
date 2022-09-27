import { isEqualToAmount, PublicKey, sol, toBigNumber } from '@/index';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';

killStuckProcess();

const CIVIC_NETWORK = new PublicKey(
  'ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6'
);

test.skip('[candyMachineModule] gatekeeper guard: it allows TODO', async (t) => {
  // Given a loaded Candy Machine with a gatekeeper guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      gatekeeper: {
        network: CIVIC_NETWORK,
        expireOnUse: false,
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
      guards: {
        gatekeeper: {
          tokenAccount: CIVIC_NETWORK,
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

test.skip('[candyMachineModule] gatekeeper guard: it forbids TODO', async (t) => {
  //
});

test.skip('[candyMachineModule] gatekeeper guard with bot tax: it charges a bot tax when trying to TODO', async (t) => {
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

test('[candyMachineModule] gatekeeper guard: it fails if no mint settings are provided', async (t) => {
  // Given a loaded Candy Machine with a gatekeeper guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      gatekeeper: {
        network: CIVIC_NETWORK,
        expireOnUse: false,
      },
    },
  });

  // When we try to mint from it without providing
  // any mint settings for the gatekeeper guard.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[gatekeeper\] guard/
  );
});
