import test from 'tape';
import {
  assertThrows,
  createNft,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../helpers';
import { findCandyMachineCollectionPda } from '@/plugins';
import { createCandyMachine } from './helpers';

killStuckProcess();

test('[candyMachineModule] it can delete a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we delete that candy machine using default values.
  await mx.candyMachines().delete({ candyMachine }).run();

  // Then the Candy Machine has been deleted.
  const account = await mx.rpc().getAccount(candyMachine.address);
  t.false(account.exists, 'candy machine should not exist');
});

test('[candyMachineModule] it can delete a candy machine using an explicit authority', async (t) => {
  // Given an existing Candy Machine with an explicit authority.
  const mx = await metaplex();
  const authority = await createWallet(mx);
  const { candyMachine } = await createCandyMachine(mx, { authority });

  // When we delete that candy machine using that authority.
  await mx.candyMachines().delete({ candyMachine, authority }).run();

  // Then the Candy Machine has been deleted.
  const account = await mx.rpc().getAccount(candyMachine.address);
  t.false(account.exists, 'candy machine should not exist');
});

test('[candyMachineModule] it cannot delete a candy machine using an invalid authority', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we delete that candy machine using an invalid authority.
  const invalidAuthority = await createWallet(mx);
  const promise = mx
    .candyMachines()
    .delete({ candyMachine, authority: invalidAuthority })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /A has one constraint was violated/);
});

test('[candyMachineModule] it can delete a candy machine with a collection NFT', async (t) => {
  // Given an existing Candy Machine with a collection NFT.
  const mx = await metaplex();
  const collectionNft = await createNft(mx);
  const { candyMachine } = await createCandyMachine(mx, {
    collection: collectionNft.address,
  });

  // When we delete that candy machine.
  await mx.candyMachines().delete({ candyMachine }).run();

  // Then the Candy Machine has been deleted.
  const account = await mx.rpc().getAccount(candyMachine.address);
  t.false(account.exists, 'candy machine should not exist');

  // And the Collection PDA has also been deleted.
  const collectionPda = await mx
    .rpc()
    .getAccount(findCandyMachineCollectionPda(candyMachine.address));
  t.false(
    collectionPda.exists,
    'candy machine collection PDA should not exist'
  );
});
