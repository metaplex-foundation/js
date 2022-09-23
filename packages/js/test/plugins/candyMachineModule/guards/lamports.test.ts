import { isEqualToAmount, sol, toBigNumber } from '@/index';
import { Keypair } from '@solana/web3.js';
import test from 'tape';
import { createWallet, killStuckProcess, metaplex } from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';

killStuckProcess();

test('[candyMachineModule] lamports guard: it transfers SOL from the payer to the destination', async (t) => {
  // Given a loaded Candy Machine with a lamports guard.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      lamports: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });

  // When we mint for another owner using this payer.
  const owner = Keypair.generate().publicKey;
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      owner,
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner,
  });

  // And the treasury received SOLs.
  const treasuryBalance = await mx.rpc().getBalance(treasury.publicKey);
  t.true(isEqualToAmount(treasuryBalance, sol(1)), 'treasury received SOLs');

  // And the payer lost SOLs.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(9), sol(0.1)), 'payer lost SOLs');
});
