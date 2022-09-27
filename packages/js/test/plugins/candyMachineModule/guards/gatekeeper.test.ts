import {
  isEqualToAmount,
  Pda,
  PublicKey,
  sol,
  toBigNumber,
  TransactionBuilder,
} from '@/index';
import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import { addGatekeeper, issueVanilla } from '@identity.com/solana-gateway-ts';

killStuckProcess();

test.only('[candyMachineModule] gatekeeper guard: it allows minting via a gatekeeper service', async (t) => {
  // Given a Gatekeeper Network.
  const mx = await metaplex();
  const GATEWAY_PROGRAM = new PublicKey(
    'gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs'
  );
  const gatekeeperAuthority = await createWallet(mx, 10);
  const gatekeeperNetwork = Keypair.generate();
  const gatekeeperAccount = Pda.find(GATEWAY_PROGRAM, [
    gatekeeperAuthority.publicKey.toBuffer(),
    gatekeeperNetwork.publicKey.toBuffer(),
    Buffer.from('gatekeeper'),
  ]);
  const addGatekeeperTx = TransactionBuilder.make().add({
    instruction: addGatekeeper(
      gatekeeperAuthority.publicKey,
      gatekeeperAccount,
      gatekeeperAuthority.publicKey,
      gatekeeperNetwork.publicKey
    ),
    signers: [gatekeeperAuthority, gatekeeperNetwork],
  });
  await addGatekeeperTx.sendAndConfirm(mx);

  // And a payer with a valid gateway Token Account from that network.
  const payer = await createWallet(mx, 10);
  const seeds = [0, 0, 0, 0, 0, 0, 0, 0];
  const gatewayTokenAccount = Pda.find(GATEWAY_PROGRAM, [
    payer.publicKey.toBuffer(),
    Buffer.from('gateway'),
    Buffer.from(seeds),
    gatekeeperNetwork.publicKey.toBuffer(),
  ]);
  const issueVanillaTx = TransactionBuilder.make().add({
    instruction: issueVanilla(
      gatewayTokenAccount,
      payer.publicKey,
      gatekeeperAccount,
      payer.publicKey,
      gatekeeperAuthority.publicKey,
      gatekeeperNetwork.publicKey,
      Buffer.from(seeds)
    ),
    signers: [payer, gatekeeperAuthority],
  });
  await issueVanillaTx.sendAndConfirm(mx);

  // And a loaded Candy Machine with a gatekeeper guard on that network.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      gatekeeper: {
        network: gatekeeperNetwork.publicKey,
        expireOnUse: false,
      },
    },
  });

  // When that payer mints from the Candy Machine using its CIVIC pass.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        gatekeeper: {
          tokenAccount: gatewayTokenAccount,
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
        network: Keypair.generate().publicKey,
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
        network: Keypair.generate().publicKey,
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
        network: Keypair.generate().publicKey,
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
