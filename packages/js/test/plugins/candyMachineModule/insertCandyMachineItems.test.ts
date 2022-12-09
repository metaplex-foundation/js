import { Keypair } from '@solana/web3.js';
import test from 'tape';
import {
  assertThrows,
  assertThrowsFn,
  killStuckProcess,
  metaplex,
} from '../../helpers';
import { create32BitsHash, createCandyMachine } from './helpers';
import { toBigNumber } from '@/index';

killStuckProcess();

test('[candyMachineModule] it can add items to a candy machine', async (t) => {
  // Given an existing Candy Machine with a capacity of 100 items.
  const mx = await metaplex();
  const authority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority,
    itemsAvailable: toBigNumber(100),
  });

  // When we add two items to the Candy Machine.
  await mx.candyMachines().insertItems({
    candyMachine,
    authority,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // Then the Candy Machine has been updated properly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  t.false(updatedCandyMachine.isFullyLoaded);
  t.equals(updatedCandyMachine.itemsLoaded, 2);
  t.equals(updatedCandyMachine.items.length, 2);
  t.deepEquals(updatedCandyMachine.items, [
    {
      index: 0,
      minted: false,
      name: 'Degen #1',
      uri: 'https://example.com/degen/1',
    },
    {
      index: 1,
      minted: false,
      name: 'Degen #2',
      uri: 'https://example.com/degen/2',
    },
  ]);
});

test('[candyMachineModule] it uses the names and URIs as suffixes when adding items to a candy machine', async (t) => {
  // Given an existing Candy Machine with prefixes for the names and URIs.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(9), // Numbers go from 1 to 9.
    itemSettings: {
      type: 'configLines',
      prefixName: 'Degen #',
      nameLength: 1, // E.g. "1".
      prefixUri: 'https://example.com/degen/',
      uriLength: 6, // E.g. "1.json".
      isSequential: false,
    },
  });

  // When we add two items to the Candy Machine by providing only the suffixes.
  await mx.candyMachines().insertItems({
    candyMachine,
    items: [
      { name: '1', uri: '1.json' },
      { name: '2', uri: '2.json' },
    ],
  });

  // Then the update Candy Machine returns the full item names and URIs.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  t.deepEquals(updatedCandyMachine.items, [
    {
      index: 0,
      minted: false,
      name: 'Degen #1',
      uri: 'https://example.com/degen/1.json',
    },
    {
      index: 1,
      minted: false,
      name: 'Degen #2',
      uri: 'https://example.com/degen/2.json',
    },
  ]);
});

test('[candyMachineModule] it cannot add items to a candy machine with hidden settings', async (t) => {
  // Given a Candy Machine with hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(10),
    itemSettings: {
      type: 'hidden',
      name: 'Degen #$ID+1$',
      uri: 'https://example.com/degen/$ID+1$.json',
      hash: create32BitsHash('some-file'),
    },
  });

  // When we try to add items to the Candy Machine.
  const promise = mx.candyMachines().insertItems({
    candyMachine,
    items: [
      { name: '1', uri: '1.json' },
      { name: '2', uri: '2.json' },
    ],
  });

  // Then we expect an error from the program.
  await assertThrows(t, promise, /HiddenSettingsDoNotHaveConfigLines/);
});

test('[candyMachineModule] it cannot add items that would make the candy machine exceed the maximum capacity', async (t) => {
  // Given an existing Candy Machine with a capacity of 2 items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
  });

  // When we try to add 3 items to the Candy Machine.
  const promise = mx.candyMachines().insertItems({
    candyMachine,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
      { name: 'Degen #3', uri: 'https://example.com/degen/3' },
    ],
  });

  // Then we expect an error to be thrown.
  await assertThrows(t, promise, /CandyMachineCannotAddAmountError/);
});

test('[candyMachineModule] it cannot add items once the candy machine is fully loaded', async (t) => {
  // Given an existing Candy Machine with 2 items loaded and a capacity of 2 items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(2),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // When we try to add one more item to the Candy Machine.
  const promise = mx.candyMachines().insertItems({
    candyMachine,
    items: [{ name: 'Degen #3', uri: 'https://example.com/degen/3' }],
  });

  // Then we expect an error to be thrown.
  await assertThrows(t, promise, /CandyMachineIsFullError/);
});

test('[candyMachineModule] it cannot add items if either of them have a name or URI that is too long', async (t) => {
  // Given a Candy Machine with a name limit of 10 characters
  // and a URI limit of 50 characters.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemSettings: {
      type: 'configLines',
      prefixName: '',
      nameLength: 10,
      prefixUri: '',
      uriLength: 50,
      isSequential: false,
    },
  });

  // When we try to add items such that one of the names is too long.
  const promiseName = mx.candyMachines().insertItems({
    candyMachine,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'x'.repeat(11), uri: 'https://example.com/degen/2' },
    ],
  });

  // Then we expect an error to be thrown regarding that name.
  await assertThrowsFn(t, promiseName, (error) => {
    t.equal(error.name, 'CandyMachineItemTextTooLongError');
    t.ok(error.message.includes('the name limit as 10 characters'));
    t.ok(error.message.includes(`the item at index 1`));
  });

  // And when we try to add items such that one of the URIs is too long.
  const promiseUri = mx.candyMachines().insertItems({
    candyMachine,
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'x'.repeat(51) },
    ],
  });

  // Then we expect an error to be thrown regarding that URI.
  await assertThrowsFn(t, promiseUri, (error) => {
    t.equal(error.name, 'CandyMachineItemTextTooLongError');
    t.ok(error.message.includes('the uri limit as 50 characters'));
    t.ok(error.message.includes(`the item at index 1`));
  });
});

test('[candyMachineModule] it can add items to a custom offset and override existing items', async (t) => {
  // Given an existing Candy Machine with 2 items loaded and capacity of 3 items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(3),
    items: [
      { name: 'Degen #1', uri: 'https://example.com/degen/1' },
      { name: 'Degen #2', uri: 'https://example.com/degen/2' },
    ],
  });

  // When we add 2 items to the Candy Machine at index 1.
  await mx.candyMachines().insertItems({
    candyMachine,
    index: 1,
    items: [
      { name: 'Degen #3', uri: 'https://example.com/degen/3' },
      { name: 'Degen #4', uri: 'https://example.com/degen/4' },
    ],
  });

  // Then the Candy Machine has been updated properly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  t.true(updatedCandyMachine.isFullyLoaded);
  t.equals(updatedCandyMachine.itemsLoaded, 3);
  t.equals(updatedCandyMachine.items.length, 3);

  // And the item of index 1 was overriden.
  t.deepEquals(updatedCandyMachine.items, [
    {
      index: 0,
      minted: false,
      name: 'Degen #1',
      uri: 'https://example.com/degen/1',
    },
    {
      index: 1,
      minted: false,
      name: 'Degen #3',
      uri: 'https://example.com/degen/3',
    },
    {
      index: 2,
      minted: false,
      name: 'Degen #4',
      uri: 'https://example.com/degen/4',
    },
  ]);
});
