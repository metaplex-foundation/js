import { Keypair } from '@solana/web3.js';
import test from 'tape';
import { createWallet, killStuckProcess, metaplex } from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import { isEqualToAmount, sol, toBigNumber } from '@/index';

killStuckProcess();

test('[candyMachineModule] botTax guard: it does nothing if all conditions are valid', async (t) => {
  // Given a loaded Candy Machine with a botTax guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
    },
  });

  // When we mint from it.
  const payer = await createWallet(mx, 10);
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

test('[candyMachineModule] botTax guard: it may charge a bot tax if the mint instruction is not the last one', async (t) => {
  // Given a loaded Candy Machine with a botTax guard
  // such that lastInstruction is set to true.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
    },
  });

  // When we try to add an instruction after the mint instruction.
  const payer = await createWallet(mx, 10);
  const mint = Keypair.generate();
  const mintBuilder = await mx.candyMachines().builders().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      mint,
    },
    { payer }
  );
  mintBuilder.add(
    mx.tokens().builders().approveDelegateAuthority({
      mintAddress: mint.publicKey,
      owner: payer,
      delegateAuthority: Keypair.generate().publicKey,
    })
  );
  await mx.rpc().sendAndConfirmTransaction(mintBuilder);

  // Then the NFT was not minted, even though the transaction was successful.
  const metadataPda = mx.nfts().pdas().metadata({ mint: mint.publicKey });
  const nftExists = await mx.rpc().accountExists(metadataPda);
  t.false(nftExists, 'NFT was not minted');

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});
