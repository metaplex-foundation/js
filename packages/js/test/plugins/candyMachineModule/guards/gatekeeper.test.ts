import { isEqualToAmount, PublicKey, sol, toBigNumber } from '@/index';
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

const CIVIC_NETWORK = new PublicKey(
  'ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6'
);

test.skip('[candyMachineModule] gatekeeper guard: it allows minting via a gatekeeper service', async (t) => {
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

test('[candyMachineModule] gatekeeper guard: it forbids minting when providing the wrong token', async (t) => {
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

  // When we try to mint from it with the wrong token.
  const payer = await createWallet(mx, 10);
  const wrongTokenAccount = Keypair.generate().publicKey;
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        gatekeeper: {
          tokenAccount: wrongTokenAccount,
        },
      },
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Gateway token is not valid/);
});

test('[candyMachineModule] gatekeeper guard with bot tax: it charges a bot tax when trying to mint using the wrong token', async (t) => {
  // Given a loaded Candy Machine with a gatekeeper guard and a botTax guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      gatekeeper: {
        network: CIVIC_NETWORK,
        expireOnUse: false,
      },
    },
  });

  // When we try to mint from it with the wrong token.
  const payer = await createWallet(mx, 10);
  const wrongTokenAccount = Keypair.generate().publicKey;
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        gatekeeper: {
          tokenAccount: wrongTokenAccount,
        },
      },
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
