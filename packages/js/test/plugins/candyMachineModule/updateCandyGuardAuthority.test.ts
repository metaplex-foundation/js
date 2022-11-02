import { Keypair } from '@solana/web3.js';
import test from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
import { createCandyGuard } from './helpers';

killStuckProcess();

test('[candyMachineModule] it can update the authority of a Candy Guard account', async (t) => {
  // Given a Candy Guard account with an old authority.
  const mx = await metaplex();
  const oldAuthority = Keypair.generate();
  const candyGuard = await createCandyGuard(mx, {
    authority: oldAuthority.publicKey,
  });

  // When we update its authority.
  const newAuthority = Keypair.generate();
  await mx.candyMachines().updateCandyGuardAuthority({
    candyGuard: candyGuard.address,
    authority: oldAuthority,
    newAuthority: newAuthority.publicKey,
  });

  // Then the updated Candy Guard has the expected data.
  const updatedCandyGuard = await mx.candyMachines().refresh(candyGuard);
  t.ok(
    updatedCandyGuard.authorityAddress.equals(newAuthority.publicKey),
    'The authority is updated'
  );
});
