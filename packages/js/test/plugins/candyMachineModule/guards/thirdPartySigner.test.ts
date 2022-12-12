import { Keypair } from '@solana/web3.js';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import { isEqualToAmount, sol, toBigNumber } from '@/index';

killStuckProcess();

test('[candyMachineModule] thirdPartySigner guard: it allows minting when the third party signer is provided', async (t) => {
  // Given a loaded Candy Machine with a third party signer guard.
  const mx = await metaplex();
  const thirdPartySigner = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      thirdPartySigner: {
        signerKey: thirdPartySigner.publicKey,
      },
    },
  });

  // When we mint from it by providing the third party as a Signer.
  const payer = await createWallet(mx, 10);
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        thirdPartySigner: {
          signer: thirdPartySigner,
        },
      },
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

test('[candyMachineModule] thirdPartySigner guard: it forbids minting when the third party signer is wrong', async (t) => {
  // Given a loaded Candy Machine with a third party signer guard.
  const mx = await metaplex();
  const thirdPartySigner = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      thirdPartySigner: {
        signerKey: thirdPartySigner.publicKey,
      },
    },
  });

  // When we try to mint from it by providing the wrong third party signer.
  const wrongThirdPartySigner = Keypair.generate();
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        thirdPartySigner: {
          signer: wrongThirdPartySigner,
        },
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /A signature was required but not found/);
});

test('[candyMachineModule] thirdPartySigner guard with bot tax: it charges a bot tax when trying to mint using the wrong third party signer', async (t) => {
  // Given a loaded Candy Machine with a third party signer guard and a bot tax guard.
  const mx = await metaplex();
  const thirdPartySigner = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      thirdPartySigner: {
        signerKey: thirdPartySigner.publicKey,
      },
    },
  });

  // When we try to mint from it by providing the wrong third party signer.
  const wrongThirdPartySigner = Keypair.generate();
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        thirdPartySigner: {
          signer: wrongThirdPartySigner,
        },
      },
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

test('[candyMachineModule] thirdPartySigner guard: minting settings must be provided', async (t) => {
  // Given a loaded Candy Machine with a third party signer guard.
  const mx = await metaplex();
  const thirdPartySigner = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      thirdPartySigner: {
        signerKey: thirdPartySigner.publicKey,
      },
    },
  });

  // When we try to mint from it without providing the third party signer.
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[thirdPartySigner\] guard/
  );
});
