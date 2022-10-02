import { CandyMachine, sol, toBigNumber, toDateTime } from '@/index';
import {
  EndSettingType,
  WhitelistMintMode,
} from '@metaplex-foundation/mpl-candy-machine';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import {
  assertThrows,
  createNft,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { create32BitsHash, createCandyMachine } from './helpers';

killStuckProcess();

test('[candyMachineModule] it can update the data of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    price: sol(1),
    sellerFeeBasisPoints: 100,
    itemsAvailable: toBigNumber(100),
    symbol: 'OLD',
    maxEditionSupply: toBigNumber(0),
    isMutable: true,
    retainAuthority: true,
    goLiveDate: toDateTime(1000000000),
  });

  // When we update the Candy Machine with the following data.
  const creatorA = Keypair.generate();
  const creatorB = Keypair.generate();
  await mx
    .candyMachines()
    .update({
      candyMachine,
      authority: mx.identity(),
      price: sol(2),
      sellerFeeBasisPoints: 200,
      itemsAvailable: toBigNumber(100), // <- Can only be updated with hidden settings.
      symbol: 'NEW',
      maxEditionSupply: toBigNumber(1),
      isMutable: false,
      retainAuthority: false,
      goLiveDate: toDateTime(2000000000),
      creators: [
        { address: creatorA.publicKey, verified: false, share: 50 },
        { address: creatorB.publicKey, verified: false, share: 50 },
      ],
    })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    price: spokSameAmount(sol(2)),
    sellerFeeBasisPoints: 200,
    itemsAvailable: spokSameBignum(100),
    symbol: 'NEW',
    maxEditionSupply: spokSameBignum(1),
    isMutable: false,
    retainAuthority: false,
    goLiveDate: spokSameBignum(2000000000),
    creators: [
      {
        address: spokSamePubkey(creatorA.publicKey),
        verified: false,
        share: 50,
      },
      {
        address: spokSamePubkey(creatorB.publicKey),
        verified: false,
        share: 50,
      },
    ],
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the itemsAvailable of a candy machine with hidden settings', async (t) => {
  // Given an existing Candy Machine with hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(100),
    hiddenSettings: {
      hash: create32BitsHash('cache-file'),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });

  // When we update the items available of a Candy Machine.
  await mx
    .candyMachines()
    .update({ candyMachine, itemsAvailable: toBigNumber(200) })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  t.equals(updatedCandyMachine.itemsAvailable.toNumber(), 200);
});

test('[candyMachineModule] it can update the hidden settings of a candy machine', async (t) => {
  // Given an existing Candy Machine with hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    hiddenSettings: {
      hash: create32BitsHash('cache-file'),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });

  // When we update these hidden settings.
  const newHash = create32BitsHash('new-cache-file');
  await mx
    .candyMachines()
    .update({
      candyMachine,
      hiddenSettings: {
        hash: newHash,
        name: 'new-mint-name',
        uri: 'https://example.com/new',
      },
    })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    hiddenSettings: {
      hash: newHash,
      name: 'new-mint-name',
      uri: 'https://example.com/new',
    },
  });
});

test('[candyMachineModule] it can add hidden settings to a candy machine that have zero items available', async (t) => {
  // Given an existing Candy Machine without hidden settings and without items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(0),
    hiddenSettings: null,
  });

  // When we add hidden settings to the Candy Machine.
  await mx
    .candyMachines()
    .update({
      candyMachine,
      authority: mx.identity(),
      hiddenSettings: {
        hash: create32BitsHash('cache-file'),
        name: 'mint-name',
        uri: 'https://example.com',
      },
    })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    hiddenSettings: {
      hash: create32BitsHash('cache-file'),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });
});

test('[candyMachineModule] it can update the end settings of a candy machine', async (t) => {
  // Given an existing Candy Machine with end settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    endSettings: {
      endSettingType: EndSettingType.Amount,
      number: toBigNumber(100),
    },
  });

  // When we update these end settings.
  await mx
    .candyMachines()
    .update({
      candyMachine,
      endSettings: {
        endSettingType: EndSettingType.Date,
        date: toDateTime(1000000000),
      },
    })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    endSettings: {
      endSettingType: EndSettingType.Date,
      date: spokSameBignum(1000000000),
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the whitelist settings of a candy machine', async (t) => {
  // Given an existing Candy Machine with whitelist settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    whitelistMintSettings: {
      mode: WhitelistMintMode.BurnEveryTime,
      mint: Keypair.generate().publicKey,
      presale: true,
      discountPrice: sol(0.5),
    },
  });

  // When we update these whitelist settings.
  const newWhitelistMint = Keypair.generate().publicKey;
  await mx
    .candyMachines()
    .update({
      candyMachine,
      whitelistMintSettings: {
        mode: WhitelistMintMode.NeverBurn,
        mint: newWhitelistMint,
        presale: false,
        discountPrice: sol(0),
      },
    })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    whitelistMintSettings: {
      mode: WhitelistMintMode.NeverBurn,
      mint: spokSamePubkey(newWhitelistMint),
      presale: false,
      discountPrice: spokSameAmount(sol(0)),
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the gatekeeper of a candy machine', async (t) => {
  // Given an existing Candy Machine with a gatekeeper.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    gatekeeper: {
      network: Keypair.generate().publicKey,
      expireOnUse: true,
    },
  });

  // When we update the gatekeeper of the Candy Machine.
  const newGatekeeperNetwork = Keypair.generate().publicKey;
  await mx
    .candyMachines()
    .update({
      candyMachine,
      gatekeeper: {
        network: newGatekeeperNetwork,
        expireOnUse: false,
      },
    })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    gatekeeper: {
      gatekeeperNetwork: spokSamePubkey(newGatekeeperNetwork),
      expireOnUse: false,
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the authority of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const authority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authority.publicKey,
  });

  // When we update the authority of the Candy Machine.
  const newAuthority = Keypair.generate();
  await mx
    .candyMachines()
    .update({ candyMachine, authority, newAuthority: newAuthority.publicKey })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  t.ok(updatedCandyMachine.authorityAddress.equals(newAuthority.publicKey));
});

test('[candyMachineModule] it cannot update the authority of a candy machine to the same authority', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const authority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authority.publicKey,
  });

  // When we update the authority of the Candy Machine with the same authority.
  const promise = mx
    .candyMachines()
    .update({ candyMachine, authority, newAuthority: authority.publicKey })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});

test('[candyMachineModule] it sends no transaction if nothing has changed when updating a candy machine.', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we send an update without providing any changes.
  const builder = mx.candyMachines().builders().update({ candyMachine });

  // Then we expect no transaction to be sent.
  t.equals(
    builder.getInstructionsWithSigners().length,
    0,
    'has zero instructions'
  );
});

test('[candyMachineModule] it throws an error if nothing has changed when updating a candy machine.', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we send an update without providing any changes.
  const promise = mx.candyMachines().update({ candyMachine }).run();

  // Then we expect an error.
  await assertThrows(t, promise, /No Instructions To Send/);
});

test('[candyMachineModule] it can update the treasury of a candy machine', async (t) => {
  // Given an existing Candy Machine with a SOL treasury.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    wallet: mx.identity().publicKey,
  });

  // And an existing SPL token.
  const { token } = await mx.tokens().createTokenWithMint().run();

  // When we update the treasury of the Candy Machine to use that SPL token.
  await mx
    .candyMachines()
    .update({
      candyMachine,
      wallet: token.address,
      tokenMint: token.mint.address,
    })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  t.ok(updatedCandyMachine.walletAddress.equals(token.address));
  t.ok(updatedCandyMachine.tokenMintAddress?.equals(token.mint.address));
});

test('[candyMachineModule] it can set the collection of a candy machine', async (t) => {
  // Given an existing Candy Machine without a collection.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    collection: null,
  });

  // When we update the Candy Machine with a new collection NFT.
  const collectionNft = await createNft(mx);
  await mx
    .candyMachines()
    .update({
      candyMachine,
      authority: mx.identity(),
      newCollection: collectionNft.address,
    })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    collectionMintAddress: spokSamePubkey(collectionNft.address),
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the collection of a candy machine', async (t) => {
  // Given an existing Candy Machine with a collection.
  const mx = await metaplex();
  const collectionNft = await createNft(mx);
  const { candyMachine } = await createCandyMachine(mx, {
    collection: collectionNft.address,
  });

  // When we update the Candy Machine with a new collection.
  const newCollectionNft = await createNft(mx);
  await mx
    .candyMachines()
    .update({
      candyMachine,
      authority: mx.identity(),
      newCollection: newCollectionNft.address,
    })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    collectionMintAddress: spokSamePubkey(newCollectionNft.address),
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can remove the collection of a candy machine', async (t) => {
  // Given an existing Candy Machine with a collection.
  const mx = await metaplex();
  const collectionNft = await createNft(mx);
  const { candyMachine } = await createCandyMachine(mx, {
    collection: collectionNft.address,
  });

  // When we remove the collection of that Candy Machine.
  await mx
    .candyMachines()
    .update({ candyMachine, authority: mx.identity(), newCollection: null })
    .run();
  const updatedCandyMachine = await mx
    .candyMachines()
    .refresh(candyMachine)
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    collectionMintAddress: null,
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it keeps the same collection when the new collection is undefined', async (t) => {
  // Given an existing Candy Machine with a collection.
  const mx = await metaplex();
  const collectionNft = await createNft(mx);
  const { candyMachine } = await createCandyMachine(mx, {
    collection: collectionNft.address,
  });

  // When we try to update the Candy Machine with an undefined collection.
  const promise = mx
    .candyMachines()
    .update({
      candyMachine,
      authority: mx.identity(),
      newCollection: undefined,
    })
    .run();

  // Then we have no instruction to send.
  await assertThrows(t, promise, /No Instructions To Send/);
});
