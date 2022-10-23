import test from 'tape';
import {
  assertThrows,
  createNft,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../helpers';
import { createCandyMachineV2 } from './helpers';
import { findCandyMachineV2CollectionPda } from '@/plugins';

killStuckProcess();

test('[candyMachineV2Module] it can delete a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachineV2(mx);

  // When we delete that candy machine using default values.
  await mx.candyMachinesV2().delete({ candyMachine });

  // Then the Candy Machine has been deleted.
  const account = await mx.rpc().getAccount(candyMachine.address);
  t.false(account.exists, 'candy machine should not exist');
});

test('[candyMachineV2Module] it can delete a candy machine using an explicit authority', async (t) => {
  // Given an existing Candy Machine with an explicit authority.
  const mx = await metaplex();
  const authority = await createWallet(mx);
  const { candyMachine } = await createCandyMachineV2(mx, { authority });

  // When we delete that candy machine using that authority.
  await mx.candyMachinesV2().delete({ candyMachine, authority });

  // Then the Candy Machine has been deleted.
  const account = await mx.rpc().getAccount(candyMachine.address);
  t.false(account.exists, 'candy machine should not exist');
});

test('[candyMachineV2Module] it cannot delete a candy machine using an invalid authority', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachineV2(mx);

  // When we delete that candy machine using an invalid authority.
  const invalidAuthority = await createWallet(mx);
  const promise = mx
    .candyMachinesV2()
    .delete({ candyMachine, authority: invalidAuthority });

  // Then we expect an error.
  await assertThrows(t, promise, /A has one constraint was violated/);
});

test('[candyMachineV2Module] it can delete a candy machine with a collection NFT', async (t) => {
  // Given an existing Candy Machine with a collection NFT.
  const mx = await metaplex();
  const collectionNft = await createNft(mx);
  const { candyMachine } = await createCandyMachineV2(mx, {
    collection: collectionNft.address,
  });

  // When we delete that candy machine.
  await mx.candyMachinesV2().delete({ candyMachine });

  // Then the Candy Machine has been deleted.
  const account = await mx.rpc().getAccount(candyMachine.address);
  t.false(account.exists, 'candy machine should not exist');

  // And the Collection PDA has also been deleted.
  const collectionPda = await mx
    .rpc()
    .getAccount(findCandyMachineV2CollectionPda(candyMachine.address));
  t.false(
    collectionPda.exists,
    'candy machine collection PDA should not exist'
  );
});
