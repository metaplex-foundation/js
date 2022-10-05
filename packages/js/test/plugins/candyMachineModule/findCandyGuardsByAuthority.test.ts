import { Keypair } from '@solana/web3.js';
import test from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
import { createCandyGuard } from './helpers';

killStuckProcess();

test('[candyMachineModule] it can fetch all candy guards from a given authority', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And two Candy Guards from authority A.
  const authorityA = Keypair.generate().publicKey;
  const candyGuardA1 = await createCandyGuard(mx, { authority: authorityA });
  const candyGuardA2 = await createCandyGuard(mx, { authority: authorityA });

  // And one Candy Guard from authority B.
  const authorityB = Keypair.generate().publicKey;
  await createCandyGuard(mx, { authority: authorityB });

  // When we fetch all Candy Guards from authority A.
  const candyGuards = await mx
    .candyMachines()
    .findAllCandyGuardsByAuthority({ authority: authorityA });

  // Then we receive the two Candy Guards from authority A.
  t.equal(candyGuards.length, 2);
  t.same(
    candyGuards.map((c) => c.address.toBase58()).sort(),
    [candyGuardA1.address.toBase58(), candyGuardA2.address.toBase58()].sort()
  );
});
