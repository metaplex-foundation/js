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

test.only('[candyMachineModule] nftPayment guard: it transfers an NFT from the payer to the destination', async (t) => {
  // Given a loaded Candy Machine with an nftPayment guard on a required collection.
  const mx = await metaplex();
  const nftTreasury = Keypair.generate();
  const requiredCollectionAuthority = Keypair.generate();
  const requiredCollection = await createCollectionNft(mx, {
    updateAuthority: requiredCollectionAuthority,
  });
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftPayment: {
        requiredCollection: requiredCollection.address,
        destination: nftTreasury.publicKey,
      },
    },
  });

  // And a payer that owns an NFT from that collection.
  const payer = await createWallet(mx, 10);
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
    collection: requiredCollection.address,
    collectionAuthority: requiredCollectionAuthority,
  });

  // When the payer mints from it using its NFT to pay.
  const { nft } = await mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
      guards: {
        nftPayment: {
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

  // And the NFT now belongs to the NFT treasury.
  // TODO
});

test.skip('[candyMachineModule] nftPayment guard: it allows minting when the NFT is not on an associated token account', async (t) => {
  //
});

test.skip('[candyMachineModule] nftPayment guard: it fails if the payer does not own the right NFT', async (t) => {
  //
});

test.skip('[candyMachineModule] nftPayment guard: it fails if the payer tries to provide an NFT from an unverified collection', async (t) => {
  //
});

test.skip('[candyMachineModule] nftPayment guard with bot tax: it charges a bot tax when trying to pay with the wrong NFT', async (t) => {
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

test('[candyMachineModule] nftPayment guard: minting settings must be provided', async (t) => {
  // Given a loaded Candy Machine with a third party signer guard.
  const mx = await metaplex();
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftPayment: {
        requiredCollection: Keypair.generate().publicKey,
        destination: Keypair.generate().publicKey,
      },
    },
  });

  // When we try to mint from it without providing the third party signer.
  const payer = await createWallet(mx, 10);
  const promise = mx
    .candyMachines()
    .mint({
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      payer,
    })
    .run();

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[nftPayment\] guard/
  );
});
