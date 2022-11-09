import { Keypair } from '@solana/web3.js';
import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import {
  CandyMachine,
  formatAmount,
  isEqualToAmount,
  Metaplex,
  sol,
  toBigNumber,
} from '@/index';

killStuckProcess();

test.skip('[candyMachineModule] freezeSolPayment guard: it transfers SOL to an escrow account', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });

  // And given the freezeSolPayment guard is initialized.
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeSolPayment',
    settings: {
      path: 'initialize',
      period: 15 * 24 * 3600, // 15 days.
      candyGuardAuthority: mx.identity(),
    },
  });

  // When we mint using an explicit payer and owner.
  const payer = await createWallet(mx, 10);
  const owner = Keypair.generate().publicKey;
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      owner,
    },
    { payer }
  );

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner,
  });

  // And the NFT is frozen.
  // TODO

  // And the treasury escrow received SOLs.
  const treasuryEscrow = mx.candyMachines().pdas().freezeEscrow({
    destination: treasury.publicKey,
    candyMachine: candyMachine.address,
    candyGuard: candyMachine.candyGuard!.address,
  });
  const treasuryEscrowBalance = await mx.rpc().getBalance(treasuryEscrow);
  t.true(
    isEqualToAmount(treasuryEscrowBalance, sol(1)),
    'treasury escrow received SOLs'
  );

  // And the payer lost SOLs.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  console.log(formatAmount(payerBalance));
  t.true(isEqualToAmount(payerBalance, sol(9), sol(0.1)), 'payer lost SOLs');
});

test('[candyMachineModule] freezeSolPayment guard: it fails to mint if the freeze escrow was not initialized', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });

  // When we try to mint without initializing the freeze escrow.
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Freeze must be initialized/);

  // And the payer didn't loose any SOL.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(10)), 'payer did not lose SOLs');
});

test('[candyMachineModule] freezeSolPayment guard: it fails if the payer does not have enough funds', async (t) => {
  // Given a loaded Candy Machine with an initialized
  // freezeSolPayment guard costing 5 SOLs.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: {
        amount: sol(5),
        destination: treasury.publicKey,
      },
    },
  });
  await initFreezeEscrow(mx, candyMachine);

  // When we mint from it using a payer that only has 4 SOL.
  const payer = await createWallet(mx, 4);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Not enough SOL to pay for the mint/);

  // And the payer didn't loose any SOL.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(isEqualToAmount(payerBalance, sol(4)), 'payer did not lose SOLs');
});

test('[candyMachineModule] freezeSolPayment guard: it fails to mint if the owner is not the payer', async (t) => {
  // Given a loaded Candy Machine with an initialized freezeSolPayment guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      freezeSolPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });
  await initFreezeEscrow(mx, candyMachine);

  // When we mint using an owner that is not the payer.
  const payer = await createWallet(mx, 10);
  const owner = Keypair.generate().publicKey;
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      owner,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /The payer must be the owner when using the \[freezeSolPayment\] guard/
  );
});

test('[candyMachineModule] freezeSolPayment guard with bot tax: it charges a bot tax if something goes wrong', async (t) => {
  // Given a loaded Candy Machine with a freezeSolPayment guard and a botTax guard.
  const mx = await metaplex();
  const treasury = Keypair.generate();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      freezeSolPayment: {
        amount: sol(1),
        destination: treasury.publicKey,
      },
    },
  });

  // When we try to mint without initializing the freeze escrow.
  const payer = await createWallet(mx, 10);
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /Candy Machine Bot Tax/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});

const initFreezeEscrow = async (mx: Metaplex, candyMachine: CandyMachine) => {
  await mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'freezeSolPayment',
    settings: {
      path: 'initialize',
      period: 15 * 24 * 3600, // 15 days.
      candyGuardAuthority: mx.identity(),
    },
  });
};
