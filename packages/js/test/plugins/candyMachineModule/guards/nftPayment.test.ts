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
import { assertNftWithToken, isEqualToAmount, sol, toBigNumber } from '@/index';

killStuckProcess();

test('[candyMachineModule] nftPayment guard: it transfers an NFT from the payer to the destination', async (t) => {
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
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftPayment: {
          mint: payerNft.address,
        },
      },
    },
    { payer }
  );

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });

  // And the NFT now belongs to the NFT treasury.
  const updatedNft = await mx.nfts().findByMint({
    mintAddress: payerNft.address,
    tokenOwner: nftTreasury.publicKey,
  });

  assertNftWithToken(updatedNft);
  t.true(
    updatedNft.token.ownerAddress.equals(nftTreasury.publicKey),
    'The NFT is now owned by the NFT treasury'
  );
});

test('[candyMachineModule] nftPayment guard: it works when the provided NFT is not on an associated token account', async (t) => {
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

  // And a payer that owns an NFT from that collection
  // but not on an associated token account.
  const payer = await createWallet(mx, 10);
  const payerNftTokenAccount = Keypair.generate();
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
    tokenAddress: payerNftTokenAccount, // <-- This creates a non-associated token account.
    collection: requiredCollection.address,
    collectionAuthority: requiredCollectionAuthority,
  });

  // When the payer mints from it using its NFT to pay
  // whilst providing the token address.
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftPayment: {
          mint: payerNft.address,
          tokenAccount: payerNftTokenAccount.publicKey,
        },
      },
    },
    { payer }
  );

  // Then minting was successful.
  await assertMintingWasSuccessful(t, mx, {
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
    nft,
    owner: payer.publicKey,
  });

  // And the NFT now belongs to the NFT treasury.
  const updatedNft = await mx.nfts().findByMint({
    mintAddress: payerNft.address,
    tokenOwner: nftTreasury.publicKey,
  });

  assertNftWithToken(updatedNft);
  t.true(
    updatedNft.token.ownerAddress.equals(nftTreasury.publicKey),
    'The NFT is now owned by the NFT treasury'
  );
});

test('[candyMachineModule] nftPayment guard: it fails if the payer does not own the right NFT', async (t) => {
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

  // And a payer that owns an NFT this is not from that collection.
  const payer = await createWallet(mx, 10);
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
  });

  // When the payer tries to mint from it using its NFT to pay.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftPayment: {
          mint: payerNft.address,
        },
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Invalid NFT collection/);
});

test('[candyMachineModule] nftPayment guard: it fails if the payer tries to provide an NFT from an unverified collection', async (t) => {
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

  // And a payer that owns an unverified NFT from that collection.
  const payer = await createWallet(mx, 10);
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
    collection: requiredCollection.address,
  });

  // When the payer tries to mint from it using its NFT to pay.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftPayment: {
          mint: payerNft.address,
        },
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Invalid NFT collection/);
});

test('[candyMachineModule] nftPayment guard with bot tax: it charges a bot tax when trying to pay with the wrong NFT', async (t) => {
  // Given a loaded Candy Machine with an nftPayment guard
  // on a required collection and a bot tax guard.
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
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      nftPayment: {
        requiredCollection: requiredCollection.address,
        destination: nftTreasury.publicKey,
      },
    },
  });

  // And a payer that owns an NFT this is not from that collection.
  const payer = await createWallet(mx, 10);
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
  });

  // When the payer tries to mint from it using its NFT to pay.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftPayment: {
          mint: payerNft.address,
        },
      },
    },
    { payer }
  );

  // Then we expect a bot tax error.
  await assertThrows(t, promise, /CandyMachineBotTaxError/);

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
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[nftPayment\] guard/
  );
});
