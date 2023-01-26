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
import { isEqualToAmount, sol, toBigNumber } from '@/index';

killStuckProcess();

test('[candyMachineModule] nftGate guard: it allows minting when the payer owns an NFT from a certain collection', async (t) => {
  // Given a payer that owns an NFT from a certain collection.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const nftGateCollectionAuthority = Keypair.generate();
  const nftGateCollection = await createCollectionNft(mx, {
    updateAuthority: nftGateCollectionAuthority,
  });
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
    collection: nftGateCollection.address,
    collectionAuthority: nftGateCollectionAuthority,
  });

  // And a loaded Candy Machine with an nftGate guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftGate: {
        requiredCollection: nftGateCollection.address,
      },
    },
  });

  // When we mint from it.
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftGate: {
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
});

test('[candyMachineModule] nftGate guard: it allows minting when the NFT is not on an associated token account', async (t) => {
  // Given a payer that owns an NFT from a certain collection on a non-associated token account.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const nftGateCollectionAuthority = Keypair.generate();
  const nftGateCollection = await createCollectionNft(mx, {
    updateAuthority: nftGateCollectionAuthority,
  });
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
    tokenAddress: Keypair.generate(), // <- We're explicitly creating a non-associated token account.
    collection: nftGateCollection.address,
    collectionAuthority: nftGateCollectionAuthority,
  });

  // And a loaded Candy Machine with an nftGate guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftGate: {
        requiredCollection: nftGateCollection.address,
      },
    },
  });

  // When we mint from it by providing the mint and token addresses.
  const { nft } = await mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftGate: {
          mint: payerNft.address,
          tokenAccount: payerNft.token.address,
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
});

test('[candyMachineModule] nftGate guard: it forbids minting when the payer does not own an NFT from a certain collection', async (t) => {
  // Given a payer that used to own an NFT from a certain collection.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const nftGateCollectionAuthority = Keypair.generate();
  const nftGateCollection = await createCollectionNft(mx, {
    updateAuthority: nftGateCollectionAuthority,
  });
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
    collection: nftGateCollection.address,
    collectionAuthority: nftGateCollectionAuthority,
  });

  // But that sent his NFT to another wallet.
  await mx.nfts().transfer({
    nftOrSft: payerNft,
    authority: payer,
    fromOwner: payer.publicKey,
    toOwner: Keypair.generate().publicKey,
  });

  // And a loaded Candy Machine with an nftGate guard on that collection.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftGate: {
        requiredCollection: nftGateCollection.address,
      },
    },
  });

  // When the payer tries to mint from it.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftGate: {
          mint: payerNft.address,
        },
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Missing NFT on the account/);
});

test('[candyMachineModule] nftGate guard: it forbids minting when the payer tries to provide an NFT from the wrong collection', async (t) => {
  // Given a payer that owns an NFT from a collection A.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const nftGateCollectionAAuthority = Keypair.generate();
  const nftGateCollectionA = await createCollectionNft(mx, {
    updateAuthority: nftGateCollectionAAuthority,
  });
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
    collection: nftGateCollectionA.address,
    collectionAuthority: nftGateCollectionAAuthority,
  });

  // And a loaded Candy Machine with an nftGate guard on a Collection B.
  const nftGateCollectionB = await createCollectionNft(mx, {
    updateAuthority: Keypair.generate(),
  });
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftGate: {
        requiredCollection: nftGateCollectionB.address,
      },
    },
  });

  // When the payer tries to mint from it using its collection A NFT.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftGate: {
          mint: payerNft.address,
        },
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Invalid NFT collection/);
});

test('[candyMachineModule] nftGate guard: it forbids minting when the payer tries to provide an NFT from an unverified collection', async (t) => {
  // Given a payer that owns an unverified NFT from a certain collection.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const nftGateCollection = await createCollectionNft(mx, {
    updateAuthority: Keypair.generate(),
  });
  const payerNft = await createNft(mx, {
    tokenOwner: payer.publicKey,
    collection: nftGateCollection.address,
  });
  t.false(payerNft.collection?.verified, 'Collection is not verified');

  // And a loaded Candy Machine with an nftGate guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftGate: {
        requiredCollection: nftGateCollection.address,
      },
    },
  });

  // When the payer tries to mint from it using its unverified NFT.
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftGate: {
          mint: payerNft.address,
        },
      },
    },
    { payer }
  );

  // Then we expect an error.
  await assertThrows(t, promise, /Invalid NFT collection/);
});

test('[candyMachineModule] nftGate guard with bot tax: it charges a bot tax when trying to mint without owning the right NFT', async (t) => {
  // Given a loaded Candy Machine with an nftGate guard and a bot tax guard.
  const mx = await metaplex();
  const nftGateCollection = await createCollectionNft(mx, {
    updateAuthority: Keypair.generate(),
  });
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      botTax: {
        lamports: sol(0.1),
        lastInstruction: true,
      },
      nftGate: {
        requiredCollection: nftGateCollection.address,
      },
    },
  });

  // When we try to mint from it using any NFT that's not from the required collection.
  const payer = await createWallet(mx, 10);
  const wrongNft = await createNft(mx, { tokenOwner: payer.publicKey });
  const promise = mx.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: collection.updateAuthority.publicKey,
      guards: {
        nftGate: {
          mint: wrongNft.address,
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

test('[candyMachineModule] nftGate guard: it fails if no mint settings are provided', async (t) => {
  // Given a payer that owns an NFT from a certain collection.
  const mx = await metaplex();
  const payer = await createWallet(mx, 10);
  const nftGateCollectionAuthority = Keypair.generate();
  const nftGateCollection = await createCollectionNft(mx, {
    updateAuthority: nftGateCollectionAuthority,
  });
  await createNft(mx, {
    tokenOwner: payer.publicKey,
    collection: nftGateCollection.address,
    collectionAuthority: nftGateCollectionAuthority,
  });

  // And a loaded Candy Machine with an nftGate guard.
  const { candyMachine, collection } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1),
    items: [{ name: 'Degen #1', uri: 'https://example.com/degen/1' }],
    guards: {
      nftGate: {
        requiredCollection: nftGateCollection.address,
      },
    },
  });

  // When we try to mint from it without providing
  // any mint settings for the nftGate guard.
  const promise = mx.candyMachines().mint({
    candyMachine,
    collectionUpdateAuthority: collection.updateAuthority.publicKey,
  });

  // Then we expect an error.
  await assertThrows(
    t,
    promise,
    /Please provide some minting settings for the \[nftGate\] guard/
  );
});
