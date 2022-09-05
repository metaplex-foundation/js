import test from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';

killStuckProcess();

test('[candyGuardModule] create with no guards', async (t) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // When we create a new Candy Guard with no guards.
  const { candyGuard } = await mx
    .candyGuards()
    .create({
      guards: {
        botTax: null,
        liveDate: null,
        lamports: null,
        splToken: null,
        thirdPartySigner: null,
        whitelist: null,
        gatekeeper: null,
        endSettings: null,
      },
    })
    .run();

  // Then ...
  console.log(candyGuard);
});
