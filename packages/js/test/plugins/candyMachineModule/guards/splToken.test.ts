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

test('[candyMachineModule] splToken guard: it transfers tokens from the payer to the destination', async (t) => {
  // Given a loaded Candy Machine with a splToken guard that requires 5 tokens.
  const mx = await metaplex();
  const treasuryAuthority = Keypair.generate();
  const { token: tokenTreasury } = await mx
    .tokens()
    .createTokenWithMint({
      mintAuthority: treasuryAuthority,
      owner: treasuryAuthority.publicKey,
      initialSupply: token(100),
    })
    .run();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      splToken: {
        amount: token(5),
        tokenMint: tokenTreasury.mint.address,
        destinationAta: tokenTreasury.address,
      },
    },
  });

  // And a payer that has 12 of these tokens.
  const payer = await createWallet(mx, 10);
  const {} = await mx
    .tokens()
    .mint({
      mintAddress: tokenTreasury.mint.address,
      mintAuthority: treasuryAuthority,
      toOwner: payer.publicKey,
      amount: token(12),
    })
    .run();

  // When we mint from it using that payer.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        splToken: { tokenOwner: payer },
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

  // And the treasury token received 5 tokens.
  const updatedTokenTreasury = await mx
    .tokens()
    .findTokenByAddress({ address: tokenTreasury.address })
    .run();
  t.true(
    isEqualToAmount(updatedTokenTreasury.amount, token(105)),
    'treasury received tokens'
  );

  // And the payer lost 5 tokens.
  const payerToken = await mx
    .tokens()
    .findTokenWithMintByMint({
      mint: tokenTreasury.mint.address,
      addressType: 'owner',
      address: payer.publicKey,
    })
    .run();
  t.true(isEqualToAmount(payerToken.amount, token(7)), 'payer lost tokens');
});

test('[candyMachineModule] splToken guard: it fails if the payer does not have enough tokens', async (t) => {
  // Given a loaded Candy Machine with a splToken guard that requires 5 tokens.
  const mx = await metaplex();
  const treasuryAuthority = Keypair.generate();
  const { token: tokenTreasury } = await mx
    .tokens()
    .createTokenWithMint({
      mintAuthority: treasuryAuthority,
      owner: treasuryAuthority.publicKey,
    })
    .run();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      splToken: {
        amount: token(5),
        tokenMint: tokenTreasury.mint.address,
        destinationAta: tokenTreasury.address,
      },
    },
  });

  // And a payer that has only 4 of these tokens.
  const payer = await createWallet(mx, 10);
  const {} = await mx
    .tokens()
    .mint({
      mintAddress: tokenTreasury.mint.address,
      mintAuthority: treasuryAuthority,
      toOwner: payer.publicKey,
      amount: token(4),
    })
    .run();

  // When we try to mint from it using that payer.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        splToken: { tokenOwner: payer },
      },
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Not enough tokens to pay for this minting/);
});

test('[candyMachineModule] splToken guard with bot tax: it charges a bot tax if the payer does not have enough tokens', async (t) => {
  // Given a loaded Candy Machine with a splToken guard that requires 5 tokens and a botTax guard.
  const mx = await metaplex();
  const treasuryAuthority = Keypair.generate();
  const { token: tokenTreasury } = await mx
    .tokens()
    .createTokenWithMint({
      mintAuthority: treasuryAuthority,
      owner: treasuryAuthority.publicKey,
    })
    .run();
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
      splToken: {
        amount: token(5),
        tokenMint: tokenTreasury.mint.address,
        destinationAta: tokenTreasury.address,
      },
    },
  });

  // And a payer that has only 4 of these tokens.
  const payer = await createWallet(mx, 10);
  const {} = await mx
    .tokens()
    .mint({
      mintAddress: tokenTreasury.mint.address,
      mintAuthority: treasuryAuthority,
      toOwner: payer.publicKey,
      amount: token(4),
    })
    .run();

  // When we try to mint from it using that payer.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        splToken: { tokenOwner: payer },
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

test('[candyMachineModule] splToken guard: it fails if no mint settings are provided', async (t) => {
  // Given a loaded Candy Machine with a splToken guard.
  const mx = await metaplex();
  const treasuryAuthority = Keypair.generate();
  const { token: tokenTreasury } = await mx
    .tokens()
    .createTokenWithMint({
      mintAuthority: treasuryAuthority,
      owner: treasuryAuthority.publicKey,
    })
    .run();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      splToken: {
        amount: token(5),
        tokenMint: tokenTreasury.mint.address,
        destinationAta: tokenTreasury.address,
      },
    },
  });

  // When we try to mint from it without providing
  // any mint settings for the splToken guard.
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
    /Please provide some minting settings for the \[splToken\] guard/
  );
});
