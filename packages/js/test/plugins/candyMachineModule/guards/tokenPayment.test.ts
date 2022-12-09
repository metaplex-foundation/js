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

test('[candyMachineModule] tokenPayment guard: it transfers tokens from the payer to the destination', async (t) => {
  // Given a loaded Candy Machine with a tokenPayment guard that requires 5 tokens.
  const mx = await metaplex();
  const treasuryAuthority = Keypair.generate();
  const { token: tokenTreasury } = await mx.tokens().createTokenWithMint({
    mintAuthority: treasuryAuthority,
    owner: treasuryAuthority.publicKey,
    initialSupply: token(100),
  });

  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenPayment: {
        amount: token(5),
        mint: tokenTreasury.mint.address,
        destinationAta: tokenTreasury.address,
      },
    },
  });

  // And a payer that has 12 of these tokens.
  const payer = await createWallet(mx, 10);
  const {} = await mx.tokens().mint({
    mintAddress: tokenTreasury.mint.address,
    mintAuthority: treasuryAuthority,
    toOwner: payer.publicKey,
    amount: token(12),
  });

  // When we mint from it using that payer.
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

  // And the treasury token received 5 tokens.
  const updatedTokenTreasury = await mx
    .tokens()
    .findTokenByAddress({ address: tokenTreasury.address });

  t.true(
    isEqualToAmount(updatedTokenTreasury.amount, token(105)),
    'treasury received tokens'
  );

  // And the payer lost 5 tokens.
  const payerToken = await mx.tokens().findTokenWithMintByMint({
    mint: tokenTreasury.mint.address,
    addressType: 'owner',
    address: payer.publicKey,
  });

  t.true(isEqualToAmount(payerToken.amount, token(7)), 'payer lost tokens');
});

test('[candyMachineModule] tokenPayment guard: it fails if the payer does not have enough tokens', async (t) => {
  // Given a loaded Candy Machine with a tokenPayment guard that requires 5 tokens.
  const mx = await metaplex();
  const treasuryAuthority = Keypair.generate();
  const { token: tokenTreasury } = await mx.tokens().createTokenWithMint({
    mintAuthority: treasuryAuthority,
    owner: treasuryAuthority.publicKey,
  });

  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      tokenPayment: {
        amount: token(5),
        mint: tokenTreasury.mint.address,
        destinationAta: tokenTreasury.address,
      },
    },
  });

  // And a payer that has only 4 of these tokens.
  const payer = await createWallet(mx, 10);
  const {} = await mx.tokens().mint({
    mintAddress: tokenTreasury.mint.address,
    mintAuthority: treasuryAuthority,
    toOwner: payer.publicKey,
    amount: token(4),
  });

  // When we try to mint from it using that payer.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Not enough tokens on the account/);
});

test('[candyMachineModule] tokenPayment guard with bot tax: it charges a bot tax if the payer does not have enough tokens', async (t) => {
  // Given a loaded Candy Machine with a tokenPayment guard that requires 5 tokens and a botTax guard.
  const mx = await metaplex();
  const treasuryAuthority = Keypair.generate();
  const { token: tokenTreasury } = await mx.tokens().createTokenWithMint({
    mintAuthority: treasuryAuthority,
    owner: treasuryAuthority.publicKey,
  });

  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      tokenPayment: {
        amount: token(5),
        mint: tokenTreasury.mint.address,
        destinationAta: tokenTreasury.address,
      },
    },
  });

  // And a payer that has only 4 of these tokens.
  const payer = await createWallet(mx, 10);
  const {} = await mx.tokens().mint({
    mintAddress: tokenTreasury.mint.address,
    mintAuthority: treasuryAuthority,
    toOwner: payer.publicKey,
    amount: token(4),
  });

  // When we try to mint from it using that payer.
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
});
