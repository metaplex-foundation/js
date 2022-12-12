import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import {
  assertMintingWasSuccessful,
  createCandyMachine,
  SEQUENTIAL_ITEM_SETTINGS,
} from '../helpers';
import {
  assertAccountExists,
  isEqualToAmount,
  PublicKey,
  sol,
  subtractAmounts,
  toBigNumber,
} from '@/index';

killStuckProcess();

test('[candyMachineModule] mintLimit guard: it allows minting when the mint limit is not reached', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 5.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
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

test('[candyMachineModule] mintLimit guard: it forbids minting when the mint limit is reached', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
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

  // And a payer already minted their NFT.
  const payer = await createWallet(mx, 10);
  await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // When that same payer tries to mint from the same Candy Machine again.
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
    /The maximum number of allowed mints was reached/
  );
});

test('[candyMachineModule] mintLimit guard: the mint limit is local to each wallet', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
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
  await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer: payerA }
  );

  const candyMachineAfterFirstMint = await mx
    .candyMachines()
    .refresh(candyMachine);

  // When payer B mints from the same Candy Machine.
  const payerB = await createWallet(mx, 10);
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer: payerB }
  );

  // Then minting was successful as the limit is per wallet.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine: candyMachineAfterFirstMint,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payerB.publicKey,
  });
});

test('[candyMachineModule] mintLimit guard with bot tax: it charges a bot tax when trying to mint after the limit', async (t) => {
  // Given a loaded Candy Machine with a mint limit of 1 and a bot tax guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    itemSettings: SEQUENTIAL_ITEM_SETTINGS,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      mintLimit: {
        id: 42,
        limit: 1,
      },
    },
  });

  // And a payer already minted their NFT.
  const payer = await createWallet(mx, 10);
  await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  const payerBalanceAfterFirstMint = await mx.rpc().getBalance(payer.publicKey);

  // When that same payer tries to mint from the same Candy Machine again.
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
  const expectedBalance = subtractAmounts(payerBalanceAfterFirstMint, sol(0.1));
  t.true(
    isEqualToAmount(payerBalance, expectedBalance, sol(0.01)),
    'payer was charged a bot tax'
  );
});
