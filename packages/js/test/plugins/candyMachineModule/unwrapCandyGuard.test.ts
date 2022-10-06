import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import { killStuckProcess, metaplex, spokSamePubkey } from '../../helpers';
import { createCandyMachine } from './helpers';
import { assert, CandyMachine } from '@/index';

killStuckProcess();

test('[candyMachineModule] it can unwrap a Candy Machine from Candy Guard', async (t) => {
  // Given a Candy Machine with a Candy Guard.
  const mx = await metaplex();
  const candyMachineAuthority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: candyMachineAuthority,
  });
  t.notEqual(candyMachine.candyGuard, null);

  // When we unwrap the Candy Machine from its Candy Guard.
  assert(!!candyMachine.candyGuard, 'Candy Machine has a Candy Guard');
  await mx.candyMachines().unwrapCandyGuard({
    candyMachine: candyMachine.address,
    candyMachineAuthority,
    candyGuard: candyMachine.candyGuard.address,
    candyGuardAuthority: candyMachineAuthority,
  });

  // Then the Candy Machine's data was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    address: spokSamePubkey(candyMachine.address),
    authorityAddress: spokSamePubkey(candyMachineAuthority.publicKey),
    mintAuthorityAddress: spokSamePubkey(candyMachineAuthority.publicKey),
    candyGuard: null,
  } as unknown as Specifications<CandyMachine>);
});
