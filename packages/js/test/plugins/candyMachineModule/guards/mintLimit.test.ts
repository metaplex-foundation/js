import {
  assertAccountExists,
  isEqualToAmount,
  PublicKey,
  sol,
  toBigNumber,
} from '@/index';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';

killStuckProcess();

test('[candyMachineModule] mintLimit guard: it allows minting when the mint limit is not reached', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 5.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      mintLimit: {
        id: 1,
        limit: 5,
      },
    },
  });

  // When we mint from it.
  const payer = await createWallet(mx, 10);
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

  // And the mint limit PDA was incremented.
  const counterPda = mx
    .candyMachines()
    .pdas()
    .mintLimitCounter({
      id: 1,
      user: payer.publicKey,
      candyMachine: candyMachine.address,
      candyGuard: candyMachine.candyGuard?.address as PublicKey,
    });
  const counterAccount = await mx.rpc().getAccount(counterPda);
  assertAccountExists(counterAccount);
  t.equal(toBigNumber(counterAccount.data, 'le').toNumber(), 1);
});

test.skip('[candyMachineModule] mintLimit guard: it forbids minting when the mint limit is reached', async (t) => {
  //
});

test.only('[candyMachineModule] mintLimit guard: the mint limit is local to each wallet', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      mintLimit: {
        id: 42,
        limit: 1,
      },
    },
  });

  // And payer A already minted their NFT.
  const payerA = await createWallet(mx, 10);
  await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer: payerA,
    })
    .run();
  const candyMachineAfterFirstMint = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // When payer B mints from the same Candy Machine.
  const payerB = await createWallet(mx, 10);
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer: payerB,
    })
    .run();

  // Then minting was successful as the limit is per wallet.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine: candyMachineAfterFirstMint,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payerB.publicKey,
  });
});

test.skip('[candyMachineModule] mintLimit guard with bot tax: it charges a bot tax when trying to mint after the limit', async (t) => {
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
