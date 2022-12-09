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

test('[candyMachineModule] tokenGate guard: it allows minting when the payer owns a specific token', async (t) => {
  // Given a payer with one token.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(1),
  });

  // And a loaded Candy Machine with the token gate guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenGate: {
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
      guards: {
        tokenGate: {
          tokenAccount: payerTokens.address,
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

test('[candyMachineModule] tokenGate guard: it allows minting when the payer owns multiple tokens from a specific mint', async (t) => {
  // Given a payer with 42 tokens.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(42),
  });

  // And a loaded Candy Machine with the token gate guard that requires 5 tokens.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenGate: {
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
      guards: {
        tokenGate: {
          tokenAccount: payerTokens.address,
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

test('[candyMachineModule] tokenGate guard: it defaults to using the associated token account of the payer', async (t) => {
  // Given a payer with one token using an associated token account.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(1),
  });

  // And a loaded Candy Machine with the token gate guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenGate: {
        mint: payerTokens.mint.address,
        amount: token(1),
      },
    },
  });

  // When the payer mints from it without specifying the token account.
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

test('[candyMachineModule] tokenGate guard: it forbids minting when the owner does not own a specific token', async (t) => {
  // Given a payer with zero tokens.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(0),
  });

  // And a loaded Candy Machine with the token gate guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenGate: {
        mint: payerTokens.mint.address,
        amount: token(1),
      },
    },
  });

  // When the payer tries to mint from it.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        tokenGate: {
          tokenAccount: payerTokens.address,
        },
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Not enough tokens on the account/);
});

test('[candyMachineModule] tokenGate guard: it forbids minting when the owner does not own enough tokens', async (t) => {
  // Given a payer with 5 tokens.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(5),
  });

  // And a loaded Candy Machine with the token gate guard that requires 10 tokens.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenGate: {
        mint: payerTokens.mint.address,
        amount: token(10),
      },
    },
  });

  // When the payer tries to mint from it.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        tokenGate: {
          tokenAccount: payerTokens.address,
        },
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Not enough tokens on the account/);
});

test('[candyMachineModule] tokenGate guard with bot tax: it charges a bot tax when trying to mint without the right amount of tokens', async (t) => {
  // Given a payer with zero tokens.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const { token: payerTokens } = await mx.tokens().createTokenWithMint({
    mintAuthority: Keypair.generate(),
    owner: payer.publicKey,
    initialSupply: token(0),
  });

  // And a loaded Candy Machine with the token gate guard and the bot tax guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      tokenGate: {
        mint: payerTokens.mint.address,
        amount: token(1),
      },
    },
  });

  // When the payer tries to mint from it.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        tokenGate: {
          tokenAccount: payerTokens.address,
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
