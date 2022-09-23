import { toBigNumber, token } from '@/index';
import { Keypair } from '@solana/web3.js';
import test from 'tape';
import { createWallet, killStuckProcess, metaplex } from '../../../helpers';
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
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });

  // // And the treasury received 5 tokens.
  // const treasuryBalance = await mx.rpc().getBalance(treasury.publicKey);
  // t.true(isEqualToAmount(treasuryBalance, sol(1)), 'treasury received SOLs');

  // // And the payer lost 5 tokens.
  // const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  // t.true(isEqualToAmount(payerBalance, sol(9), sol(0.1)), 'payer lost SOLs');
});

test.skip('[candyMachineModule] splToken guard: it fails if the payer does not have enough tokens', async (t) => {
  //
});

test.skip('[candyMachineModule] splToken guard with bot tax: it charges a bot tax if the payer does not have enough tokens', async (t) => {
  //
});
