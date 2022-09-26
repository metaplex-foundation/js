import { isEqualToAmount, sol, toBigNumber, token } from '@/index';
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

test.only('[candyMachineModule] tokenBurn guard: it burns a specific token to allow minting', async (t) => {
  // Given a payer with one token.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx
    .tokens()
    .createTokenWithMint({
      mintAuthority: Keypair.generate(),
      owner: payer.publicKey,
      initialSupply: token(1),
    })
    .run();

  // And a loaded Candy Machine with the tokenBurn guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenBurn: {
        mint: payerTokens.mint.address,
        amount: token(1),
      },
    },
  });

  // When we mint from it.
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

  // And the payer's token was burned.
  // TODO
});

test.skip('[candyMachineModule] tokenBurn guard: it may burn multiple tokens from a specific mint', async (t) => {
  //
});

test.skip('[candyMachineModule] tokenBurn guard: it may explicitely provide the token account and burn authority', async (t) => {
  //
});

test.skip('[candyMachineModule] tokenBurn guard: it fails to mint if there are not enough tokens to burn', async (t) => {
  //
});

test.skip('[candyMachineModule] tokenBurn guard with bot tax: it charges a bot tax when trying to TODO', async (t) => {
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
