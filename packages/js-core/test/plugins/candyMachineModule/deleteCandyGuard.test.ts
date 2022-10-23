import { Keypair } from '@solana/web3.js';
import test from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
import { createCandyGuard } from './helpers';

killStuckProcess();

test('[candyMachineModule] it can delete a Candy Guard', async (t) => {
  // Given an existing Candy Guard.
  const mx = await metaplex();
  const candyGuardAuthority = Keypair.generate();
  const candyGuard = await createCandyGuard(mx, {
    authority: candyGuardAuthority.publicKey,
  });

  // When we delete the Candy Guard account.
  await mx.candyMachines().deleteCandyGuard({
    candyGuard: candyGuard.address,
    authority: candyGuardAuthority,
  });

  // Then the Candy Guard account no longer exists.
  t.false(await mx.rpc().accountExists(candyGuard.address));
});
