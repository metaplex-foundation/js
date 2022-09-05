import { emptyDefaultCandyGuardSettings } from '@/plugins/candyGuardModule/guards';
import test from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';

killStuckProcess();

test('[candyGuardModule] create with no guards', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with no guards.
  const { candyGuard } = await mx
    .candyGuards()
    .create({ guards: emptyDefaultCandyGuardSettings })
    .run();

  // Then ...
  console.log(candyGuard);
});
