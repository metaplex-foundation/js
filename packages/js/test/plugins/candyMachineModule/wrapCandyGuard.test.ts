import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import { killStuckProcess, metaplex, spokSamePubkey } from '../../helpers';
import { createCandyGuard, createCandyMachine } from './helpers';
import { CandyMachine } from '@/index';

killStuckProcess();

test('[candyMachineModule] it can wrap a Candy Machine in a Candy Guard', async (t) => {
  // Given a Candy Machine without a Candy Guard.
  const mx = await metaplex();
  const candyMachineAuthority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: candyMachineAuthority,
    withoutCandyGuard: true,
  });
  t.equal(candyMachine.candyGuard, null);

  // And a Candy Guard.
  const candyGuardAuthority = Keypair.generate();
  const candyGuard = await createCandyGuard(mx, {
    authority: candyGuardAuthority.publicKey,
  });

  // When we wrap this Candy Machine with that Candy Guard.
  await mx.candyMachines().wrapCandyGuard({
    candyMachine: candyMachine.address,
    candyMachineAuthority,
    candyGuard: candyGuard.address,
    candyGuardAuthority,
  });

  // Then the Candy Machine's data was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    address: spokSamePubkey(candyMachine.address),
    authorityAddress: spokSamePubkey(candyMachineAuthority.publicKey),
    candyGuard: {
      model: 'candyGuard',
      address: spokSamePubkey(candyGuard.address),
      authorityAddress: spokSamePubkey(candyGuardAuthority.publicKey),
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can wrap a different Candy Guard on a Candy Machine', async (t) => {
  // Given a Candy Machine wrapped in a Candy Guard.
  const mx = await metaplex();
  const candyMachineAuthority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: candyMachineAuthority,
  });
  t.notEqual(candyMachine.candyGuard, null);

  // And a new Candy Guard.
  const newCandyGuardAuthority = Keypair.generate();
  const newCandyGuard = await createCandyGuard(mx, {
    authority: newCandyGuardAuthority.publicKey,
  });

  // When we wrap the Candy Machine with that new Candy Guard.
  await mx.candyMachines().wrapCandyGuard({
    candyMachine: candyMachine.address,
    candyMachineAuthority,
    candyGuard: newCandyGuard.address,
    candyGuardAuthority: newCandyGuardAuthority,
  });

  // Then the Candy Machine's data was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    address: spokSamePubkey(candyMachine.address),
    authorityAddress: spokSamePubkey(candyMachineAuthority.publicKey),
    candyGuard: {
      model: 'candyGuard',
      address: spokSamePubkey(newCandyGuard.address),
      authorityAddress: spokSamePubkey(newCandyGuardAuthority.publicKey),
    },
  } as unknown as Specifications<CandyMachine>);
});
