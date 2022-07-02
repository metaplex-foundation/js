import test from 'tape';
import { killStuckProcess, metaplex } from '../../helpers';
import { createCandyMachine } from './helpers';

killStuckProcess();

test('[candyMachineModule] it can add items to a candy machine', async (t) => {
  // Given an existing Candy Machine with 100 capacity.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: 100,
  });

  // When we add two items to the Candy Machine.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .insertItems(candyMachine, {
      authority: mx.identity(),
      items: [
        { name: 'Degen #1', uri: 'https://example.com/degen/1' },
        { name: 'Degen #2', uri: 'https://example.com/degen/2' },
      ],
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.false(updatedCandyMachine.isFullyLoaded);
  t.equals(updatedCandyMachine.itemsLoaded, 2);
  t.equals(updatedCandyMachine.items.length, 2);
  t.deepEquals(updatedCandyMachine.items, [
    { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    { name: 'Degen #2', uri: 'https://example.com/degen/2' },
  ]);
});

test.skip('[candyMachineModule] it cannot add items that would make the candy machine exceed the maximum capacity', async (t) => {
  // Given an existing Candy Machine with 100 capacity.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: 100,
  });

  // When we add ??? items to the Candy Machine.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .insertItems(candyMachine, {
      authority: mx.identity(),
      items: [
        // ...
      ],
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.false(updatedCandyMachine.isFullyLoaded);
  t.equals(updatedCandyMachine.itemsLoaded, 2);
  t.equals(updatedCandyMachine.items.length, 2);
  t.deepEquals(updatedCandyMachine.items, [
    { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    { name: 'Degen #2', uri: 'https://example.com/degen/2' },
  ]);
});

test.skip('[candyMachineModule] it cannot add items once the candy machine is fully loaded', async (t) => {
  // Given an existing Candy Machine with 100 capacity.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: 100,
  });

  // When we add ??? items to the Candy Machine.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .insertItems(candyMachine, {
      authority: mx.identity(),
      items: [
        // ...
      ],
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.false(updatedCandyMachine.isFullyLoaded);
  t.equals(updatedCandyMachine.itemsLoaded, 2);
  t.equals(updatedCandyMachine.items.length, 2);
  t.deepEquals(updatedCandyMachine.items, [
    { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    { name: 'Degen #2', uri: 'https://example.com/degen/2' },
  ]);
});

test.skip('[candyMachineModule] it cannot add items if either of them have a name or URI that is too long', async (t) => {
  // Given an existing Candy Machine with 100 capacity.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: 100,
  });

  // When we add ??? items to the Candy Machine.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .insertItems(candyMachine, {
      authority: mx.identity(),
      items: [
        // ...
      ],
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.false(updatedCandyMachine.isFullyLoaded);
  t.equals(updatedCandyMachine.itemsLoaded, 2);
  t.equals(updatedCandyMachine.items.length, 2);
  t.deepEquals(updatedCandyMachine.items, [
    { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    { name: 'Degen #2', uri: 'https://example.com/degen/2' },
  ]);
});

test.skip('[candyMachineModule] it can add items to a custom offset and override existing items', async (t) => {
  // Given an existing Candy Machine with 100 capacity.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: 100,
  });

  // When we add ??? items to the Candy Machine.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .insertItems(candyMachine, {
      authority: mx.identity(),
      items: [
        // ...
      ],
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.false(updatedCandyMachine.isFullyLoaded);
  t.equals(updatedCandyMachine.itemsLoaded, 2);
  t.equals(updatedCandyMachine.items.length, 2);
  t.deepEquals(updatedCandyMachine.items, [
    { name: 'Degen #1', uri: 'https://example.com/degen/1' },
    { name: 'Degen #2', uri: 'https://example.com/degen/2' },
  ]);
});
