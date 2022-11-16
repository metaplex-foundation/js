import test from 'tape';
import { createWallet, killStuckProcess, metaplex } from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';
import { toBigNumber, PublicKey, NftWithToken } from '@/index';

killStuckProcess();

test('[candyMachineModule] programGate guard: it allows minting with specified program in transaction', async (t) => {
  // Given a loaded Candy Machine with an array of specified guards.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      programGate: {
        additional: [
          new PublicKey('hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk'),
        ],
      },
    },
  });

  // When we mint from it.
  const payer = await createWallet(mx, 10);
  const transactionBuilder = await mx.candyMachines().builders().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  const { tokenAddress } = transactionBuilder.getContext();

  // And our specified program interacts in transaction
  // TODO: Need help here

  // Then we send and confirm transaction
  await mx.rpc().sendAndConfirmTransaction(transactionBuilder);

  const nft = (await mx
    .nfts()
    .findByMint({ mintAddress: tokenAddress })) as NftWithToken;

  // And minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });
});

test('[candyMachineModule] programGate guard: it forbids minting with unspecified program in transaction', async (t) => {});

test('[candyMachineModule] programGate guard with bot tax: it charges a bot tax when trying to mint with unspecified program in transaction', async (t) => {});
