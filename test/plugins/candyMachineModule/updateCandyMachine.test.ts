import test from 'tape';
import spok, { Specifications } from 'spok';
import {
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { CandyMachine, sol } from '@/index';
import { createCandyMachine, createHash } from './helpers';
import { Keypair } from '@solana/web3.js';

killStuckProcess();

test('[candyMachineModule] it can update the data of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    price: sol(1),
    sellerFeeBasisPoints: 100,
    itemsAvailable: 100,
    symbol: 'OLD',
    maxEditionSupply: 0,
    isMutable: true,
    retainAuthority: true,
    goLiveDate: 1000000000,
    creators: mx.identity().publicKey,
  });

  // When we update the Candy Machine with the following data.
  const creatorA = Keypair.generate();
  const creatorB = Keypair.generate();
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      price: sol(2),
      sellerFeeBasisPoints: 200,
      itemsAvailable: 100, // <- Can only be updated with hidden settings.
      symbol: 'NEW',
      maxEditionSupply: 1,
      isMutable: false,
      retainAuthority: false,
      goLiveDate: 2000000000,
      creators: [
        { address: creatorA.publicKey, verified: false, share: 50 },
        { address: creatorB.publicKey, verified: false, share: 50 },
      ],
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    price: spokSameAmount(sol(2)),
    sellerFeeBasisPoints: 200,
    itemsAvailable: 100,
    symbol: 'NEW',
    maxEditionSupply: spokSameBignum(1),
    isMutable: false,
    retainAuthority: false,
    goLiveDate: spokSameBignum(2000000000),
    creators: [
      {
        address: spokSamePubkey(creatorA.publicKey),
        verified: false,
        share: 50,
      },
      {
        address: spokSamePubkey(creatorB.publicKey),
        verified: false,
        share: 50,
      },
    ],
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the itemsAvailable of a candy machine with hidden settings', async (t) => {
  // Given an existing Candy Machine with hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: 100,
    hiddenSettings: {
      hash: createHash('cache-file', 32),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });

  // When we update the Candy Machine with ...
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      itemsAvailable: 200,
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.equals(updatedCandyMachine.itemsAvailable, 200);
});

test('[candyMachineModule] it can update the hidden settings of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    // ...
  });

  // When we update the Candy Machine with ...
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      // ...
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    // ...
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it cannot add or remove hidden settings to a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    // ...
  });

  // When we update the Candy Machine with ...
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      // ...
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    // ...
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the end settings of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    // ...
  });

  // When we update the Candy Machine with ...
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      // ...
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    // ...
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the whitelist settings of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    // ...
  });

  // When we update the Candy Machine with ...
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      // ...
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    // ...
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the gatekeeper of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    // ...
  });

  // When we update the Candy Machine with ...
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      // ...
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    // ...
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the authority of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    // ...
  });

  // When we update the Candy Machine with ...
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      // ...
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    // ...
  } as unknown as Specifications<CandyMachine>);
});
