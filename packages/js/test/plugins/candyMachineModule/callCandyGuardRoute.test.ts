import test from 'tape';
import {
  assertThrows,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../helpers';
import { createCandyMachine } from './helpers';
import { getMerkleProof, getMerkleRoot, sol } from '@/index';

killStuckProcess();

test('[candyMachineModule] it can call the route instruction of a specific guard', async (t) => {
  // Given a Candy Machine with an allowList guard which supports the route instruction.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const allowedWallets = [
    payer.publicKey.toBase58(),
    'Ur1CbWSGsXCdedknRbJsEk7urwAvu1uddmQv51nAnXB',
    'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
    '2vjCrmEFiN9CLLhiqy8u1JPh48av8Zpzp3kNkdTtirYG',
  ];
  const { candyMachine } = await createCandyMachine(mx, {
    guards: {
      allowList: { merkleRoot: getMerkleRoot(allowedWallets) },
    },
  });

  // When we call the "proof" route of the guard by providing a valid proof.
  await mx.candyMachines().callGuardRoute(
    {
      candyMachine,
      guard: 'allowList',
      settings: {
        path: 'proof',
        merkleProof: getMerkleProof(allowedWallets, payer.publicKey.toBase58()),
      },
    },
    { payer }
  );

  // Then the transaction was successful and a PDA
  // was created to allow minting for that payer.
  const merkleProofPda = mx
    .candyMachines()
    .pdas()
    .merkleProof({
      merkleRoot: getMerkleRoot(allowedWallets),
      user: payer.publicKey,
      candyMachine: candyMachine.address,
      candyGuard: candyMachine.candyGuard!.address,
    });
  t.true(
    await mx.rpc().accountExists(merkleProofPda),
    'Merkle proof PDA was created'
  );
});

test('[candyMachineModule] it can call the route instruction of a specific guard on a group', async (t) => {
  // Given a Candy Machine with two allowList guards which supports the route instruction.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const allowedWalletsA = [
    payer.publicKey.toBase58(),
    'Ur1CbWSGsXCdedknRbJsEk7urwAvu1uddmQv51nAnXB',
  ];
  const allowedWalletsB = [
    'GjwcWFQYzemBtpUoN5fMAP2FZviTtMRWCmrppGuTthJS',
    '2vjCrmEFiN9CLLhiqy8u1JPh48av8Zpzp3kNkdTtirYG',
  ];
  const { candyMachine } = await createCandyMachine(mx, {
    groups: [
      {
        label: 'GROUPA',
        guards: { allowList: { merkleRoot: getMerkleRoot(allowedWalletsA) } },
      },
      {
        label: 'GROUPB',
        guards: { allowList: { merkleRoot: getMerkleRoot(allowedWalletsB) } },
      },
    ],
  });

  // When we call the "proof" route of the guard in group A.
  await mx.candyMachines().callGuardRoute(
    {
      candyMachine,
      guard: 'allowList',
      group: 'GROUPA',
      settings: {
        path: 'proof',
        merkleProof: getMerkleProof(
          allowedWalletsA,
          payer.publicKey.toBase58()
        ),
      },
    },
    { payer }
  );

  // Then the transaction was successful and a PDA was
  // created to allow the payer to mint in group A.
  const merkleProofPdaA = mx
    .candyMachines()
    .pdas()
    .merkleProof({
      merkleRoot: getMerkleRoot(allowedWalletsA),
      user: payer.publicKey,
      candyMachine: candyMachine.address,
      candyGuard: candyMachine.candyGuard!.address,
    });
  t.true(
    await mx.rpc().accountExists(merkleProofPdaA),
    'Merkle proof PDA was created for group A'
  );

  // But no PDA was created for group B.
  const merkleProofPdaB = mx
    .candyMachines()
    .pdas()
    .merkleProof({
      merkleRoot: getMerkleRoot(allowedWalletsB),
      user: payer.publicKey,
      candyMachine: candyMachine.address,
      candyGuard: candyMachine.candyGuard!.address,
    });
  t.false(
    await mx.rpc().accountExists(merkleProofPdaB),
    'Merkle proof PDA was not created for group B'
  );
});

test('[candyMachineModule] it fails to call the route instruction of a guard that does not support it', async (t) => {
  // Given a Candy Machine with a botTax guard which does not supports the route instruction.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    guards: {
      botTax: {
        lastInstruction: true,
        lamports: sol(0.1),
      },
    },
  });

  // When we try to call the route of the botTax guard.
  const promise = mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'botTax',
    settings: {},
  });

  // Then we expect an error.
  await assertThrows(t, promise, /GuardRouteNotSupportedError/);
});

test('[candyMachineModule] it fails to call the route instruction on a Candy Machine with no Candy Guard account', async (t) => {
  // Given a Candy Machine without a Candy Guard account.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    withoutCandyGuard: true,
  });

  // When we try to call the route of any guard.
  const promise = mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'allowList',
    settings: {
      path: 'proof',
      merkleProof: getMerkleProof(['a'], 'a'),
    },
  });

  // Then we expect an error.
  await assertThrows(t, promise, /CandyGuardRequiredOnCandyMachineError/);
});

test('[candyMachineModule] it fails if no group label is provided on Candy Machines using groups', async (t) => {
  // Given a Candy Machine using guard groups.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    groups: [
      {
        label: 'VIP',
        guards: {
          allowList: { merkleRoot: getMerkleRoot(['a']) },
        },
      },
    ],
  });

  // When we try to call the route of guard without specifying a group.
  const promise = mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'allowList',
    settings: {
      path: 'proof',
      merkleProof: getMerkleProof(['a'], 'a'),
    },
  });

  // Then we expect an error.
  await assertThrows(t, promise, /GuardGroupRequiredError/);
});

test('[candyMachineModule] it fails if a group label is provided on Candy Machines not using groups', async (t) => {
  // Given a Candy Machine not using guard groups.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    guards: {
      allowList: { merkleRoot: getMerkleRoot(['a']) },
    },
  });

  // When we try to call the route of guard whilst specifying a group.
  const promise = mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'allowList',
    group: 'VIP',
    settings: {
      path: 'proof',
      merkleProof: getMerkleProof(['a'], 'a'),
    },
  });

  // Then we expect an error.
  await assertThrows(t, promise, /SelectedGuardGroupDoesNotExistError/);
});

test('[candyMachineModule] it fails if the guard is not enabled on the resolved guards', async (t) => {
  // Given a Candy Machine with two guard groups such that
  // group A has the allowList guard enabled and group B does not.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    groups: [
      {
        label: 'GROUPA',
        guards: { allowList: { merkleRoot: getMerkleRoot(['a']) } },
      },
      {
        label: 'GROUPB',
        guards: { mintLimit: { id: 1, limit: 1 } },
      },
    ],
  });

  // When we try to call the allowList route using group B.
  const promise = mx.candyMachines().callGuardRoute({
    candyMachine,
    guard: 'allowList',
    group: 'GROUPB',
    settings: {
      path: 'proof',
      merkleProof: getMerkleProof(['a'], 'a'),
    },
  });

  // Then we expect an error.
  await assertThrows(t, promise, /GuardNotEnabledError/);
});
