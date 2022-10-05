import { Keypair } from '@solana/web3.js';
import test from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
import { createCandyMachine } from './helpers';
import { assert } from '@/index';

killStuckProcess();

test('[candyMachineModule] it can delete a Candy Machine', async (t) => {
  // Given an existing Candy Machine with a Candy Guard.
  const mx = await metaplex();
  const candyMachineAuthority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: candyMachineAuthority,
  });
  assert(!!candyMachine.candyGuard, 'Candy Machine has a Candy Guard');

  // When we delete the Candy Machine account.
  await mx.candyMachines().delete({
    candyMachine: candyMachine.address,
    authority: candyMachineAuthority,
  });

  // Then the Candy Machine account no longer exists.
  t.false(await mx.rpc().accountExists(candyMachine.address));

  // But the Candy Guard account still exists.
  t.true(await mx.rpc().accountExists(candyMachine.candyGuard.address));
});

test('[candyMachineModule] it can delete a Candy Machine with its Candy Guard', async (t) => {
  // Given an existing Candy Machine with a Candy Guard.
  const mx = await metaplex();
  const candyMachineAuthority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: candyMachineAuthority,
  });
  assert(!!candyMachine.candyGuard, 'Candy Machine has a Candy Guard');

  // When we delete the Candy Machine account whilst specifying the Candy Guard.
  await mx.candyMachines().delete({
    candyMachine: candyMachine.address,
    candyGuard: candyMachine.candyGuard.address,
    authority: candyMachineAuthority,
  });

  // Then both the Candy Machine and Candy Guard accounts no longer exist.
  t.false(await mx.rpc().accountExists(candyMachine.address));
  t.false(await mx.rpc().accountExists(candyMachine.candyGuard.address));
});
