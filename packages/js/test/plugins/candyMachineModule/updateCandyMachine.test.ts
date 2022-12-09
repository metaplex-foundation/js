import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test from 'tape';
import {
  assertThrows,
  assertThrowsFn,
  createCollectionNft,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { create32BitsHash, createCandyMachine } from './helpers';
import {
  CandyMachine,
  emptyDefaultCandyGuardSettings,
  sol,
  toBigNumber,
  toDateTime,
} from '@/index';

killStuckProcess();

test('[candyMachineModule] it can update the data of a candy machine', async (t) => {
  // Given a Candy Machine with the following data.
  const mx = await metaplex();
  const creatorA = Keypair.generate().publicKey;
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1000),
    symbol: 'OLD',
    sellerFeeBasisPoints: 100,
    maxEditionSupply: toBigNumber(1),
    isMutable: true,
    creators: [{ address: creatorA, share: 100 }],
    itemSettings: {
      type: 'configLines',
      prefixName: 'My Old NFT #',
      nameLength: 4,
      prefixUri: 'https://arweave.net/',
      uriLength: 50,
      isSequential: true,
    },
  });

  // When we update its data.
  const creatorB = Keypair.generate().publicKey;
  await mx.candyMachines().update({
    candyMachine,
    itemsAvailable: toBigNumber(1000), // Cannot be updated.
    symbol: 'NEW',
    sellerFeeBasisPoints: 200,
    maxEditionSupply: toBigNumber(2),
    isMutable: false,
    creators: [{ address: creatorB, share: 100 }],
    itemSettings: {
      type: 'configLines',
      prefixName: 'My Old NFT #$ID+1$',
      nameLength: 0,
      prefixUri: 'https://my.app.com/nfts/$ID+1$',
      uriLength: 0,
      isSequential: false,
    },
  });

  // Then the Candy Machine's data was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    address: spokSamePubkey(candyMachine.address),
    authorityAddress: spokSamePubkey(candyMachine.authorityAddress),
    mintAuthorityAddress: spokSamePubkey(candyMachine.mintAuthorityAddress),
    collectionMintAddress: spokSamePubkey(candyMachine.collectionMintAddress),
    symbol: 'NEW',
    sellerFeeBasisPoints: 200,
    isMutable: false,
    maxEditionSupply: spokSameBignum(2),
    creators: [{ address: spokSamePubkey(creatorB), share: 100 }],
    items: [],
    itemsAvailable: spokSameBignum(1000),
    itemsMinted: spokSameBignum(0),
    itemsRemaining: spokSameBignum(1000),
    itemsLoaded: 0,
    isFullyLoaded: false,
    itemSettings: {
      type: 'configLines',
      prefixName: 'My Old NFT #$ID+1$',
      nameLength: 0,
      prefixUri: 'https://my.app.com/nfts/$ID+1$',
      uriLength: 0,
      isSequential: false,
    },
    candyGuard: {
      model: 'candyGuard',
      address: spokSamePubkey(candyMachine.candyGuard?.address),
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it cannot update the number of items when using config line settings', async (t) => {
  // Given a Candy Machine using config line settings with 1000 items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1000),
    itemSettings: {
      type: 'configLines',
      prefixName: 'My Old NFT #',
      nameLength: 4,
      prefixUri: 'https://arweave.net/',
      uriLength: 50,
      isSequential: true,
    },
  });

  // When we try to update the number of items to 2000.
  const promise = mx
    .candyMachines()
    .update({ candyMachine, itemsAvailable: toBigNumber(2000) });

  // Then we get an error from the Program.
  await assertThrows(t, promise, /CannotChangeNumberOfLines/);
});

test('[candyMachineModule] it can update the number of items when using hidden settings', async (t) => {
  // Given a Candy Machine using hidden settings with 1000 items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1000),
    itemSettings: {
      type: 'hidden',
      name: 'My NFT #$ID+1$',
      uri: 'https://my.app.com/nfts/$ID+1$.json',
      hash: create32BitsHash('some-file'),
    },
  });

  // When we update the number of items to 2000.
  await mx
    .candyMachines()
    .update({ candyMachine, itemsAvailable: toBigNumber(2000) });

  // Then the Candy Machine's data was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  t.equal(updatedCandyMachine.itemsAvailable.toNumber(), 2000);
});

test('[candyMachineModule] it can update the hidden settings of a candy machine', async (t) => {
  // Given a Candy Machine using the following hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemSettings: {
      type: 'hidden',
      name: 'My Old NFT #$ID+1$',
      uri: 'https://old.app.com/nfts/$ID+1$.json',
      hash: create32BitsHash('some-old-file'),
    },
  });

  // When we update its hidden settings to the following.
  await mx.candyMachines().update({
    candyMachine,
    itemSettings: {
      type: 'hidden',
      name: 'My NFT NFT #$ID+1$',
      uri: 'https://nft.app.com/nfts/$ID+1$.json',
      hash: create32BitsHash('some-new-file'),
    },
  });

  // Then the Candy Machine's data was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  t.same(updatedCandyMachine.itemSettings, {
    type: 'hidden',
    name: 'My NFT NFT #$ID+1$',
    uri: 'https://nft.app.com/nfts/$ID+1$.json',
    hash: create32BitsHash('some-new-file'),
  });
});

test('[candyMachineModule] it cannot go from hidden settings to config line settings', async (t) => {
  // Given a Candy Machine using the following hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemSettings: {
      type: 'hidden',
      name: 'My NFT #$ID+1$',
      uri: 'https://my.app.com/nfts/$ID+1$.json',
      hash: create32BitsHash('some-file'),
    },
  });

  // When we try to update it so it uses config line settings instead.
  const promise = mx.candyMachines().update({
    candyMachine,
    itemSettings: {
      type: 'configLines',
      prefixName: 'My NFT #',
      nameLength: 4,
      prefixUri: 'https://arweave.net/',
      uriLength: 50,
      isSequential: true,
    },
  });

  // Then we expect an error from the Program.
  await assertThrows(t, promise, /CannotSwitchFromHiddenSettings/);
});

test('[candyMachineModule] it cannot go from config line settings to hidden settings', async (t) => {
  // Given a Candy Machine using the following config line settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemSettings: {
      type: 'configLines',
      prefixName: 'My NFT #',
      nameLength: 4,
      prefixUri: 'https://arweave.net/',
      uriLength: 50,
      isSequential: true,
    },
  });

  // When we try to update it so it uses hidden settings instead.
  const promise = mx.candyMachines().update({
    candyMachine,
    itemSettings: {
      type: 'hidden',
      name: 'My NFT #$ID+1$',
      uri: 'https://my.app.com/nfts/$ID+1$.json',
      hash: create32BitsHash('some-file'),
    },
  });

  // Then we expect an error from the Program.
  await assertThrows(t, promise, /CannotSwitchToHiddenSettings/);
});

test('[candyMachineModule] updating part of the data does not override the rest of it', async (t) => {
  // Given a Candy Machine with the following data.
  const mx = await metaplex();
  const creatorA = Keypair.generate().publicKey;
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: toBigNumber(1000),
    symbol: 'MYNFT',
    sellerFeeBasisPoints: 100,
    maxEditionSupply: toBigNumber(1),
    isMutable: true,
    creators: [{ address: creatorA, share: 100 }],
    itemSettings: {
      type: 'configLines',
      prefixName: 'My NFT #',
      nameLength: 4,
      prefixUri: 'https://arweave.net/',
      uriLength: 50,
      isSequential: true,
    },
  });

  // When we only update its symbol.
  await mx.candyMachines().update({ candyMachine, symbol: 'NEW' });

  // Then the rest of the data is still the same.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    symbol: 'NEW',
    sellerFeeBasisPoints: 100,
    isMutable: true,
    maxEditionSupply: spokSameBignum(1),
    creators: [{ address: spokSamePubkey(creatorA), share: 100 }],
    itemsAvailable: spokSameBignum(1000),
    itemSettings: {
      type: 'configLines',
      prefixName: 'My NFT #',
      nameLength: 4,
      prefixUri: 'https://arweave.net/',
      uriLength: 50,
      isSequential: true,
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it fails when the provided data to update misses properties', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we try to update part of its data by providing the Candy Machine as a public key.
  const promise = mx
    .candyMachines()
    .update({ candyMachine: candyMachine.address, symbol: 'NEW' });

  // Then we expect an error telling us some data is missing from the input.
  await assertThrowsFn(t, promise, (error) => {
    const missingProperties =
      '[itemsAvailable, sellerFeeBasisPoints, maxEditionSupply, isMutable, creators, itemSettings]';
    t.equal(error.name, 'MissingInputDataError');
    t.ok(error.message.includes(missingProperties));
  });
});

test('[candyMachineModule] it can update the authority of a candy machine', async (t) => {
  // Given a Candy Machine using authority A.
  const mx = await metaplex();
  const authorityA = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authorityA,
  });

  // When we update it to use authority B.
  const authorityB = Keypair.generate();
  await mx.candyMachines().update({
    candyMachine,
    authority: authorityA,
    newAuthority: authorityB.publicKey,
  });

  // Then the Candy Machine's authority was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    authorityAddress: spokSamePubkey(authorityB.publicKey),
    mintAuthorityAddress: spokSamePubkey(candyMachine.mintAuthorityAddress),
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the mint authority of a candy machine', async (t) => {
  // Given an Candy Machine with a mint authority equal to its authority.
  const mx = await metaplex();
  const authorityA = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authorityA,
    withoutCandyGuard: true,
  });
  t.ok(candyMachine.mintAuthorityAddress.equals(authorityA.publicKey));

  // When we update its mint authority.
  const mintAuthorityB = Keypair.generate();
  await mx.candyMachines().update({
    candyMachine,
    authority: authorityA,
    newMintAuthority: mintAuthorityB,
  });

  // Then the Candy Machine's mint authority was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    authorityAddress: spokSamePubkey(authorityA.publicKey),
    mintAuthorityAddress: spokSamePubkey(mintAuthorityB.publicKey),
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the authority of a candy guard', async (t) => {
  // Given a Candy Machine and its Candy Guard using authority A.
  const mx = await metaplex();
  const authorityA = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authorityA,
  });

  // When we update the Candy Guard account to use authority B.
  const authorityB = Keypair.generate();
  await mx.candyMachines().update({
    candyMachine,
    candyGuardAuthority: authorityA,
    newCandyGuardAuthority: authorityB.publicKey,
  });

  // Then the Candy Guard's authority was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);
  const updatedCandyGuard = updatedCandyMachine.candyGuard!;
  t.ok(
    updatedCandyMachine.authorityAddress.equals(authorityA.publicKey),
    'Candy Machine authority was not updated'
  );
  t.ok(
    updatedCandyGuard.authorityAddress.equals(authorityB.publicKey),
    'Candy Guard authority was updated'
  );
});

test('[candyMachineModule] it can update both the authority and the candy guard authority of a candy machine', async (t) => {
  // Given a Candy Machine and its Candy Guard using authority A.
  const mx = await metaplex();
  const authorityA = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authorityA,
  });

  // When we update both authorities to authority B.
  const authorityB = Keypair.generate();
  await mx.candyMachines().update({
    candyMachine,
    authority: authorityA,
    newAuthority: authorityB.publicKey,
    newCandyGuardAuthority: authorityB.publicKey,
  });

  // Then the both the candy machine and the candy guard were updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);
  const updatedCandyGuard = updatedCandyMachine.candyGuard!;
  t.ok(
    updatedCandyMachine.authorityAddress.equals(authorityB.publicKey),
    'Candy Machine authority was updated'
  );
  t.ok(
    updatedCandyGuard.authorityAddress.equals(authorityB.publicKey),
    'Candy Guard authority was updated'
  );
});

test('[candyMachineModule] it can update the collection of a candy machine', async (t) => {
  // Given a Candy Machine associated to Collection A.
  const mx = await metaplex();
  const collectionUpdateAuthorityA = Keypair.generate();
  const collectionA = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthorityA,
  });
  const { candyMachine } = await createCandyMachine(mx, {
    collection: {
      address: collectionA.address,
      updateAuthority: collectionUpdateAuthorityA,
    },
  });

  // When we update its collection to Collection B.
  const collectionUpdateAuthorityB = Keypair.generate();
  const collectionB = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthorityB,
  });
  await mx.candyMachines().update({
    candyMachine,
    collection: {
      address: collectionB.address,
      updateAuthority: collectionUpdateAuthorityB,
    },
  });

  // Then the Candy Machine's collection was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  t.ok(updatedCandyMachine.collectionMintAddress.equals(collectionB.address));
});

test('[candyMachineModule] it can update the collection of a candy machine when passed as a public key', async (t) => {
  // Given a Candy Machine associated to Collection A.
  const mx = await metaplex();
  const collectionUpdateAuthorityA = Keypair.generate();
  const collectionA = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthorityA,
  });
  const { candyMachine } = await createCandyMachine(mx, {
    collection: {
      address: collectionA.address,
      updateAuthority: collectionUpdateAuthorityA,
    },
  });

  // When we update its collection to Collection B by providing the Candy
  // Machine as a public key and the current collection's mint address.
  const collectionUpdateAuthorityB = Keypair.generate();
  const collectionB = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthorityB,
  });
  await mx.candyMachines().update({
    candyMachine: candyMachine.address,
    collection: {
      address: collectionB.address,
      updateAuthority: collectionUpdateAuthorityB,
      currentCollectionAddress: candyMachine.collectionMintAddress,
    },
  });

  // Then the Candy Machine's collection was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  t.ok(updatedCandyMachine.collectionMintAddress.equals(collectionB.address));
});

test('[candyMachineModule] it fails when the provided collection to update misses properties', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we try to update its collection without providing all data
  // and by providing the Candy Machine as a public key.
  const collectionUpdateAuthority = Keypair.generate();
  const collection = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthority,
  });
  const promise = mx.candyMachines().update({
    candyMachine: candyMachine.address,
    collection: {
      address: collection.address,
      updateAuthority: collectionUpdateAuthority,
      // <- Misses the current collection mint address to revoke current authority.
    },
  });

  // Then we expect an error telling us some data is missing from the input.
  await assertThrowsFn(t, promise, (error) => {
    const missingProperties = '[collection.currentCollectionAddress]';
    t.equal(error.name, 'MissingInputDataError');
    t.ok(error.message.includes(missingProperties));
  });
});

test('[candyMachineModule] it can update the guards of a candy machine', async (t) => {
  // Given a Candy Machine using the following guards and groups.
  const mx = await metaplex();
  const treasuryA = Keypair.generate().publicKey;
  const { candyMachine } = await createCandyMachine(mx, {
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
    },
    groups: [
      {
        label: 'OLD1',
        guards: {
          startDate: { date: toDateTime('2022-09-13T10:00:00.000Z') },
          solPayment: { amount: sol(2), destination: treasuryA },
        },
      },
      {
        label: 'OLD2',
        guards: {
          startDate: { date: toDateTime('2022-09-13T12:00:00.000Z') },
          solPayment: { amount: sol(4), destination: treasuryA },
        },
      },
    ],
  });

  // When we update its Candy Guard settings to the following.
  const treasuryB = Keypair.generate().publicKey;
  await mx.candyMachines().update({
    candyMachine,
    guards: {
      botTax: { lamports: sol(0.02), lastInstruction: false },
    },
    groups: [
      {
        label: 'NEW1',
        guards: {
          startDate: { date: toDateTime('2022-09-15T10:00:00.000Z') },
          solPayment: { amount: sol(1), destination: treasuryB },
          endDate: { date: toDateTime('2022-09-15T12:00:00.000Z') },
        },
      },
      {
        label: 'NEW2',
        guards: {
          startDate: { date: toDateTime('2022-09-15T12:00:00.000Z') },
          solPayment: { amount: sol(3), destination: treasuryB },
        },
      },
    ],
  });

  // Then the Candy Guard's data was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    candyGuard: {
      model: 'candyGuard',
      address: spokSamePubkey(candyMachine.candyGuard?.address),
      guards: {
        ...emptyDefaultCandyGuardSettings,
        botTax: { lamports: spokSameAmount(sol(0.02)), lastInstruction: false },
      },
      groups: [
        {
          label: 'NEW1',
          guards: {
            ...emptyDefaultCandyGuardSettings,
            startDate: {
              date: spokSameBignum(toDateTime('2022-09-15T10:00:00.000Z')),
            },
            solPayment: {
              amount: spokSameAmount(sol(1)),
              destination: spokSamePubkey(treasuryB),
            },
            endDate: {
              date: spokSameBignum(toDateTime('2022-09-15T12:00:00.000Z')),
            },
          },
        },
        {
          label: 'NEW2',
          guards: {
            ...emptyDefaultCandyGuardSettings,
            startDate: {
              date: spokSameBignum(toDateTime('2022-09-15T12:00:00.000Z')),
            },
            solPayment: {
              amount: spokSameAmount(sol(3)),
              destination: spokSamePubkey(treasuryB),
            },
          },
        },
      ],
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] updating part of the Candy Guard data does not override the rest of it', async (t) => {
  // Given a Candy Machine using the following guards and groups.
  const mx = await metaplex();
  const treasury = Keypair.generate().publicKey;
  const { candyMachine } = await createCandyMachine(mx, {
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
    },
    groups: [
      {
        label: 'GROUP1',
        guards: {
          startDate: { date: toDateTime('2022-09-13T10:00:00.000Z') },
          solPayment: { amount: sol(2), destination: treasury },
        },
      },
      {
        label: 'GROUP2',
        guards: {
          startDate: { date: toDateTime('2022-09-13T12:00:00.000Z') },
          solPayment: { amount: sol(4), destination: treasury },
        },
      },
    ],
  });

  // When we only update the guards without providing the groups.
  await mx.candyMachines().update({
    candyMachine,
    guards: {
      botTax: { lamports: sol(0.02), lastInstruction: false },
    },
  });

  // Then the Candy Guard's guards were updated and the groups were not overriden.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    candyGuard: {
      model: 'candyGuard',
      address: spokSamePubkey(candyMachine.candyGuard?.address),
      guards: {
        ...emptyDefaultCandyGuardSettings,
        botTax: { lamports: spokSameAmount(sol(0.02)), lastInstruction: false },
      },
      groups: [
        {
          label: 'GROUP1',
          guards: {
            ...emptyDefaultCandyGuardSettings,
            startDate: {
              date: spokSameBignum(toDateTime('2022-09-13T10:00:00.000Z')),
            },
            solPayment: {
              amount: spokSameAmount(sol(2)),
              destination: spokSamePubkey(treasury),
            },
          },
        },
        {
          label: 'GROUP2',
          guards: {
            ...emptyDefaultCandyGuardSettings,
            startDate: {
              date: spokSameBignum(toDateTime('2022-09-13T12:00:00.000Z')),
            },
            solPayment: {
              amount: spokSameAmount(sol(4)),
              destination: spokSamePubkey(treasury),
            },
          },
        },
      ],
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the guards of a candy machine when passed as a public key', async (t) => {
  // Given a Candy Machine using the following guards and groups.
  const mx = await metaplex();
  const treasuryA = Keypair.generate().publicKey;
  const { candyMachine } = await createCandyMachine(mx, {
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
    },
    groups: [
      {
        label: 'OLD1',
        guards: {
          startDate: { date: toDateTime('2022-09-13T10:00:00.000Z') },
          solPayment: { amount: sol(2), destination: treasuryA },
        },
      },
      {
        label: 'OLD2',
        guards: {
          startDate: { date: toDateTime('2022-09-13T12:00:00.000Z') },
          solPayment: { amount: sol(4), destination: treasuryA },
        },
      },
    ],
  });

  // When we update its Candy Guard settings by providing the Candy Machine
  // as a public key and by providing the Candy Guard's address explicitly.
  const treasuryB = Keypair.generate().publicKey;
  await mx.candyMachines().update({
    candyMachine: candyMachine.address,
    candyGuard: candyMachine.candyGuard?.address,
    guards: {
      botTax: { lamports: sol(0.02), lastInstruction: false },
    },
    groups: [
      {
        label: 'NEW1',
        guards: {
          startDate: { date: toDateTime('2022-09-15T10:00:00.000Z') },
          solPayment: { amount: sol(1), destination: treasuryB },
          endDate: { date: toDateTime('2022-09-15T12:00:00.000Z') },
        },
      },
      {
        label: 'NEW2',
        guards: {
          startDate: { date: toDateTime('2022-09-15T12:00:00.000Z') },
          solPayment: { amount: sol(3), destination: treasuryB },
        },
      },
    ],
  });

  // Then the Candy Guard's data was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    candyGuard: {
      model: 'candyGuard',
      address: spokSamePubkey(candyMachine.candyGuard?.address),
      guards: {
        ...emptyDefaultCandyGuardSettings,
        botTax: { lamports: spokSameAmount(sol(0.02)), lastInstruction: false },
      },
      groups: [
        {
          label: 'NEW1',
          guards: {
            ...emptyDefaultCandyGuardSettings,
            startDate: {
              date: spokSameBignum(toDateTime('2022-09-15T10:00:00.000Z')),
            },
            solPayment: {
              amount: spokSameAmount(sol(1)),
              destination: spokSamePubkey(treasuryB),
            },
            endDate: {
              date: spokSameBignum(toDateTime('2022-09-15T12:00:00.000Z')),
            },
          },
        },
        {
          label: 'NEW2',
          guards: {
            ...emptyDefaultCandyGuardSettings,
            startDate: {
              date: spokSameBignum(toDateTime('2022-09-15T12:00:00.000Z')),
            },
            solPayment: {
              amount: spokSameAmount(sol(3)),
              destination: spokSamePubkey(treasuryB),
            },
          },
        },
      ],
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it fails when the provided guards to update miss properties', async (t) => {
  // Given a Candy Machine using the following guards.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
    },
  });

  // When we try to update its Candy Guard settings by only providing the guards object
  // and by passing the Candy Machine as a public key.
  const promise = mx.candyMachines().update({
    candyMachine: candyMachine.address,
    guards: {
      botTax: { lamports: sol(0.02), lastInstruction: false },
    },
  });

  // Then we expect an error telling us some data is missing from the input.
  await assertThrowsFn(t, promise, (error) => {
    const missingProperties = '[candyGuard, groups]';
    t.equal(error.name, 'MissingInputDataError');
    t.ok(error.message.includes(missingProperties));
  });
});

test('[candyMachineModule] it fails when there is nothing to update', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx);

  // When we try to update it without any changes.
  const promise = mx.candyMachines().update({ candyMachine });

  // Then we expect an error telling us there is nothing to update.
  await assertThrows(t, promise, /NoInstructionsToSendError/);
});

test('[candyMachineModule] it can update data, authorities, collection and guards at the same time', async (t) => {
  // Given an existing Candy Machine with the following data.
  const mx = await metaplex();
  const authorityA = Keypair.generate();
  const treasuryA = Keypair.generate().publicKey;
  const collectionUpdateAuthorityA = Keypair.generate();
  const collectionA = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthorityA,
  });
  const { candyMachine } = await createCandyMachine(mx, {
    symbol: 'OLD',
    sellerFeeBasisPoints: 100,
    authority: authorityA,
    collection: {
      address: collectionA.address,
      updateAuthority: collectionUpdateAuthorityA,
    },
    guards: {
      botTax: { lamports: sol(0.01), lastInstruction: true },
      solPayment: { amount: sol(1), destination: treasuryA },
    },
  });

  // When we update its data, authorities, collection and guards.
  const authorityB = Keypair.generate().publicKey;
  const treasuryB = Keypair.generate().publicKey;
  const collectionUpdateAuthorityB = Keypair.generate();
  const collectionB = await createCollectionNft(mx, {
    updateAuthority: collectionUpdateAuthorityB,
  });
  await mx.candyMachines().update({
    candyMachine,
    authority: authorityA,
    newAuthority: authorityB,
    // newMintAuthority: it makes no sense to update this
    // property whilst updating the Candy Guard settings
    // since this will unwrap the associated Candy Guard.
    symbol: 'NEW',
    sellerFeeBasisPoints: 200,
    collection: {
      address: collectionB.address,
      updateAuthority: collectionUpdateAuthorityB,
    },
    guards: {
      botTax: { lamports: sol(0.02), lastInstruction: false },
      solPayment: { amount: sol(2), destination: treasuryB },
    },
  });

  // Then the Candy Machine's data was updated accordingly.
  const updatedCandyMachine = await mx.candyMachines().refresh(candyMachine);

  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    model: 'candyMachine',
    address: spokSamePubkey(candyMachine.address),
    authorityAddress: spokSamePubkey(authorityB),
    mintAuthorityAddress: spokSamePubkey(candyMachine.mintAuthorityAddress),
    collectionMintAddress: spokSamePubkey(collectionB.address),
    symbol: 'NEW',
    sellerFeeBasisPoints: 200,
    candyGuard: {
      model: 'candyGuard',
      address: spokSamePubkey(candyMachine.candyGuard?.address),
      guards: {
        ...emptyDefaultCandyGuardSettings,
        botTax: { lamports: spokSameAmount(sol(0.02)), lastInstruction: false },
        solPayment: {
          amount: spokSameAmount(sol(2)),
          destination: spokSamePubkey(treasuryB),
        },
      },
    },
  } as unknown as Specifications<CandyMachine>);
});
