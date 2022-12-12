import { Keypair } from '@solana/web3.js';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import { isEqualToAmount, sol, toBigNumber, token } from '@/index';

killStuckProcess();

test('[candyMachineModule] tokenBurn guard: it burns a specific token to allow minting', async (t) => {
  // Given a payer with one token.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(1),
  });

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

  // When the payer mints from it.
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

  // And the payer's token was burned.
  const refreshedPayerTokens = await mx
    .tokens()
    .findTokenByAddress({ address: payerTokens.address });

  t.ok(
    isEqualToAmount(refreshedPayerTokens.amount, token(0)),
    'payer now has zero tokens'
  );
});

test('[candyMachineModule] tokenBurn guard: it may burn multiple tokens from a specific mint', async (t) => {
  // Given a payer with 42 token.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(42),
  });

  // And a loaded Candy Machine with the tokenBurn guard that requires 5 tokens.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenBurn: {
        mint: payerTokens.mint.address,
        amount: token(5),
      },
    },
  });

  // When the payer mints from it.
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

  // And the payer lost 5 tokens.
  const refreshedPayerTokens = await mx
    .tokens()
    .findTokenByAddress({ address: payerTokens.address });

  t.ok(
    isEqualToAmount(refreshedPayerTokens.amount, token(37)),
    'payer now has 37 tokens'
  );
});

test('[candyMachineModule] tokenBurn guard: it fails to mint if there are not enough tokens to burn', async (t) => {
  // Given a payer with one token.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(1),
  });

  // And a loaded Candy Machine with the tokenBurn guard that requires 2 tokens.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenBurn: {
        mint: payerTokens.mint.address,
        amount: token(2),
      },
    },
  });

  // When the payer tries to mint from it.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Not enough tokens on the account/);

  // And the payer still has one token.
  const refreshedPayerTokens = await mx
    .tokens()
    .findTokenByAddress({ address: payerTokens.address });

  t.ok(
    isEqualToAmount(refreshedPayerTokens.amount, token(1)),
    'payer still has one token'
  );
});

test('[candyMachineModule] tokenBurn guard with bot tax: it charges a bot tax when trying to mint without the required amount of tokens', async (t) => {
  // Given a payer with one token.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(1),
  });

  // And a loaded Candy Machine with a botTax guard and a tokenBurn guard that requires 2 tokens.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      tokenBurn: {
        mint: payerTokens.mint.address,
        amount: token(2),
      },
    },
  });

  // When the payer tries to mint from it.
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

  // And the payer still has one token.
  const refreshedPayerTokens = await mx
    .tokens()
    .findTokenByAddress({ address: payerTokens.address });

  t.ok(
    isEqualToAmount(refreshedPayerTokens.amount, token(1)),
    'payer still has one token'
  );
});
