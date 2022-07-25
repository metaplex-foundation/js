import { Keypair } from '@solana/web3.js';
import test from 'tape';
import { createWallet, killStuckProcess, metaplex } from '../../helpers';
import { createCandyMachine } from './helpers';

killStuckProcess();

test('[candyMachineModule] it can delete a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we delete that candy machine using default values.
  await mx.candyMachines().delete(candyMachine).run();

  // Then the Candy Machine has been deleted.
  const account = await mx.rpc().getAccount(candyMachine.address);
  t.false(account.exists, 'candy machine should not exist');
});

test.only('[candyMachineModule] it can delete a candy machine using an explicit authority', async (t) => {
  // Given an existing Candy Machine with an explicit authority.
  const mx = await metaplex();
  const authority = await createWallet(mx);
  const { candyMachine } = await createCandyMachine(mx, { authority });

  // When we delete that candy machine using that authority.
  await mx.candyMachines().delete(candyMachine, { authority }).run();

  // Then the Candy Machine has been deleted.
  const account = await mx.rpc().getAccount(candyMachine.address);
  t.false(account.exists, 'candy machine should not exist');
});

test.skip('[candyMachineModule] it cannot delete a candy machine using an invalid authority', async (t) => {});

test.skip('[candyMachineModule] it can delete a candy machine with a collection NFT', async (t) => {});
