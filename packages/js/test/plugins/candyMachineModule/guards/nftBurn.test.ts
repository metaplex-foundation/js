import { isEqualToAmount, sol, toBigNumber } from '@/index';
import { Keypair } from '@solana/web3.js';
import test from 'tape';
import {
  assertThrows,
  createCollectionNft,
  createNft,
  createWallet,
  killStuckProcess,
  metaplex,
} from '../../../helpers';
import { assertMintingWasSuccessful, createCandyMachine } from '../helpers';

killStuckProcess();

test.skip('[candyMachineModule] nftBurn guard: it burns a specific NFT to allow minting', async (t) => {
  // Given a payer that owns an NFT from a certain collection.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const nftBurnCollectionAuthority = Keypair.generate();
  const nftBurnCollection = await createCollectionNft(mx, {
    updateAuthority: nftBurnCollectionAuthority,
  });
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
    collection: nftBurnCollection.address,
    collectionAuthority: nftBurnCollectionAuthority,
  });

  // And a loaded Candy Machine with an nftBurn guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftBurn: {
        requiredCollection: nftBurnCollection.address,
      },
    },
  });

  // When we mint from it.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        nftBurn: {
          mint: payerNft.address,
        },
      },
    })
    .run();

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });

  // And the NFT was burned.
});

test.skip('[candyMachineModule] nftBurn guard: it fails if there is not valid NFT to burn', async (t) => {
  //
});

test.skip('[candyMachineModule] nftBurn guard with bot tax: it charges a bot tax when trying to mint using the wrong NFT', async (t) => {
  // TODO
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const promise = (async () => {})();

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /Candy Machine Bot Tax/);

  // And the payer was charged a bot tax.
  const payerBalance = await mx.rpc().getBalance(payer.publicKey);
  t.true(
    isEqualToAmount(payerBalance, sol(9.9), sol(0.01)),
    'payer was charged a bot tax'
  );
});

test('[candyMachineModule] nftBurn guard: it fails if no mint settings are provided', async (t) => {
  // Given a payer that owns an NFT from a certain collection.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const nftBurnCollectionAuthority = Keypair.generate();
  const nftBurnCollection = await createCollectionNft(mx, {
    updateAuthority: nftBurnCollectionAuthority,
  });
  await createNft(mx, {
    tokenOwner: payer.publicKey,
    collection: nftBurnCollection.address,
    collectionAuthority: nftBurnCollectionAuthority,
  });

  // And a loaded Candy Machine with an nftBurn guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftBurn: {
        requiredCollection: nftBurnCollection.address,
      },
    },
  });

  // When we try to mint from it without providing
  // any mint settings for the nftBurn guard.
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[nftBurn\] guard/
  );
});
