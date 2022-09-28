import { Nft, Sft, toMetaplexFile } from '@/index';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  createCollectionNft,
  createNft,
  createSft,
  killStuckProcess,
  metaplex,
  spokSamePubkey,
} from '../../helpers';
import {
  assertCollectionHasSize,
  assertRefreshedCollectionHasSize,
} from './helpers';

killStuckProcess();

test('[nftModule] it can update the on-chain metadata of an NFT', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT.
  const nft = await createNft(mx, {
    name: 'On-chain NFT name',
    symbol: 'OLD',
    sellerFeeBasisPoints: 100,
    isMutable: true,
    json: {
      name: 'JSON NFT name',
      description: 'JSON NFT description',
      image: toMetaplexFile('some image', 'some-image.jpg'),
    },
  });

  // And some new updated metadata that has been uploadeds.
  const { uri: updatedUri, metadata: updatedMetadata } = await mx
    .nfts()
    .uploadMetadata({
      name: 'Updated JSON NFT name',
      description: 'Updated JSON NFT description',
      image: toMetaplexFile('updated image', 'updated-image.jpg'),
    })
    .run();

  // When we update the NFT with new on-chain data.
  await mx
    .nfts()
    .update({
      nftOrSft: nft,
      name: 'Updated On-chain NFT name',
      symbol: 'UPDATED',
      sellerFeeBasisPoints: 500,
      primarySaleHappened: true,
      uri: updatedUri,
      isMutable: false,
    })
    .run();

  // Then the returned NFT should have the updated data.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated Nft',
    model: 'nft',
    name: 'Updated On-chain NFT name',
    symbol: 'UPDATED',
    sellerFeeBasisPoints: 500,
    uri: updatedUri,
    isMutable: false,
    primarySaleHappened: true,
    json: {
      name: 'Updated JSON NFT name',
      description: 'Updated JSON NFT description',
      image: updatedMetadata.image,
    },
    token: {
      address: spokSamePubkey(nft.token.address),
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can update the on-chain metadata of an SFT', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And an existing SFT.
  const sft = await createSft(mx, {
    name: 'On-chain SFT name',
    symbol: 'OLD',
    sellerFeeBasisPoints: 100,
    isMutable: true,
    json: {
      name: 'JSON SFT name',
      description: 'JSON SFT description',
      image: toMetaplexFile('some image', 'some-image.jpg'),
    },
  });

  // And some new updated metadata that has been uploadeds.
  const { uri: updatedUri, metadata: updatedMetadata } = await mx
    .nfts()
    .uploadMetadata({
      name: 'Updated JSON SFT name',
      description: 'Updated JSON SFT description',
      image: toMetaplexFile('updated image', 'updated-image.jpg'),
    })
    .run();

  // When we update the NFT with new on-chain data.
  await mx
    .nfts()
    .update({
      nftOrSft: sft,
      name: 'Updated On-chain SFT name',
      symbol: 'UPDATED',
      sellerFeeBasisPoints: 500,
      primarySaleHappened: true,
      uri: updatedUri,
      isMutable: false,
    })
    .run();

  // Then the returned NFT should have the updated data.
  const updatedSft = await mx.nfts().refresh(sft).run();
  spok(t, updatedSft, {
    $topic: 'Updated SFT',
    model: 'sft',
    name: 'Updated On-chain SFT name',
    symbol: 'UPDATED',
    sellerFeeBasisPoints: 500,
    uri: updatedUri,
    isMutable: false,
    primarySaleHappened: true,
    json: {
      name: 'Updated JSON SFT name',
      description: 'Updated JSON SFT description',
      image: updatedMetadata.image,
    },
  } as unknown as Specifications<Sft>);
});

test('[nftModule] it can update and verify creators at the same time', async (t: Test) => {
  // Given we have a Metaplex instance.
  const mx = await metaplex();

  // And 4 creators.
  const creatorA = Keypair.generate();
  const creatorB = Keypair.generate();
  const creatorC = Keypair.generate();
  const creatorD = Keypair.generate();

  // And an existing NFT with:
  // - creatorA verified
  // - creatorB unverified
  // - creatorC unverified
  const nft = await createNft(mx, {
    creators: [
      {
        address: mx.identity().publicKey,
        share: 40,
      },
      {
        address: creatorA.publicKey,
        authority: creatorA,
        share: 30,
      },
      {
        address: creatorB.publicKey,
        share: 20,
      },
      {
        address: creatorC.publicKey,
        share: 10,
      },
    ],
  });
  t.ok(nft.creators[0].verified, 'update authority is verified');
  t.ok(nft.creators[1].verified, 'creatorA is verified');
  t.ok(!nft.creators[2].verified, 'creatorB is not verified');
  t.ok(!nft.creators[3].verified, 'creatorC is not verified');

  // When we update the NFT with such that:
  // - update authority was removed from the creators
  // - creatorA is still verified
  // - creatorB is still unverified
  // - creatorC is now verified
  // - creatorD is added and verified
  await mx
    .nfts()
    .update({
      nftOrSft: nft,
      creators: [
        {
          address: creatorA.publicKey,
          share: 30,
        },
        {
          address: creatorB.publicKey,
          share: 20,
        },
        {
          address: creatorC.publicKey,
          authority: creatorC,
          share: 10,
        },
        {
          address: creatorD.publicKey,
          authority: creatorD,
          share: 40,
        },
      ],
    })
    .run();

  // Then the returned NFT should have the updated data.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated Nft',
    model: 'nft',
    creators: [
      {
        address: creatorA.publicKey,
        verified: true,
        share: 30,
      },
      {
        address: creatorB.publicKey,
        verified: false,
        share: 20,
      },
      {
        address: creatorC.publicKey,
        verified: true,
        share: 10,
      },
      {
        address: creatorD.publicKey,
        verified: true,
        share: 40,
      },
    ],
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can set the parent Collection of an NFT', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT with no parent collection.
  const nft = await createNft(mx);
  t.false(nft.collection, 'has no parent collection');

  // And a collection NFT with no items in it yet.
  const collectionNft = await createCollectionNft(mx);
  assertCollectionHasSize(t, collectionNft, 0);

  // When we update that NFT by providing a parent collection.
  await mx
    .nfts()
    .update({
      nftOrSft: nft,
      collection: collectionNft.address,
    })
    .run();

  // Then the updated NFT is now from that collection.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated NFT',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collectionNft.address),
      verified: false,
    },
  } as unknown as Specifications<Nft>);

  // And the collection NFT has the same size because we did not verify it.
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 0);
});

test('[nftModule] it can set and verify the parent Collection of an NFT', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT with no parent collection.
  const nft = await createNft(mx);
  t.false(nft.collection, 'has no parent collection');

  // And a collection NFT with no items in it yet.
  const collectionAuthority = Keypair.generate();
  const collectionNft = await createCollectionNft(mx, {
    updateAuthority: collectionAuthority,
  });
  assertCollectionHasSize(t, collectionNft, 0);

  // When we update that NFT by providing a parent collection and its authority.
  await mx
    .nfts()
    .update({
      nftOrSft: nft,
      collection: collectionNft.address,
      collectionAuthority: collectionAuthority,
    })
    .run();

  // Then the updated NFT is now from that collection and it is verified.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated NFT',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collectionNft.address),
      verified: true,
    },
  } as unknown as Specifications<Nft>);

  // And the size of the collection NFT was incremented by 1.
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 1);
});

test('[nftModule] it can set and verify the parent Collection of an NFT using a delegated authority', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT with no parent collection.
  const nft = await createNft(mx);
  t.false(nft.collection, 'has no parent collection');

  // And a collection NFT with delegated authority and no items in it yet.
  const delegatedCollectionAuthority = Keypair.generate();
  const collectionNft = await createCollectionNft(mx);
  assertCollectionHasSize(t, collectionNft, 0);
  await mx
    .nfts()
    .approveCollectionAuthority({
      mintAddress: collectionNft.address,
      collectionAuthority: delegatedCollectionAuthority.publicKey,
    })
    .run();

  // When we update that NFT by providing a parent collection and its delegated authority.
  await mx
    .nfts()
    .update({
      nftOrSft: nft,
      collection: collectionNft.address,
      collectionAuthority: delegatedCollectionAuthority,
      collectionAuthorityIsDelegated: true,
    })
    .run();

  // Then the updated NFT is now from that collection and it is verified.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated NFT',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collectionNft.address),
      verified: true,
    },
  } as unknown as Specifications<Nft>);

  // And the size of the collection NFT was incremented by 1.
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 1);
});

test('[nftModule] it can update the parent Collection of an NFT even when verified', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And two new collection NFTs A and B.
  const collectionNftA = await createCollectionNft(mx);
  const collectionNftB = await createCollectionNft(mx);

  // And an existing NFT with that belongs to collection A.
  const nft = await createNft(mx, {
    collection: collectionNftA.address,
    collectionAuthority: mx.identity(),
  });
  t.true(nft.collection?.verified, 'has verified parent collection');
  await assertRefreshedCollectionHasSize(t, mx, collectionNftA, 1);
  await assertRefreshedCollectionHasSize(t, mx, collectionNftB, 0);

  // When we update that NFT so it is part of collection B.
  await mx
    .nfts()
    .update({
      nftOrSft: nft,
      collection: collectionNftB.address,
      collectionAuthority: mx.identity(),
    })
    .run();

  // Then the updated NFT is now from collection B.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated NFT',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collectionNftB.address),
      verified: true,
    },
  } as unknown as Specifications<Nft>);

  // And the collection size of both collections were updated.
  await assertRefreshedCollectionHasSize(t, mx, collectionNftA, 0);
  await assertRefreshedCollectionHasSize(t, mx, collectionNftB, 1);
});

test('[nftModule] it can unset the parent Collection of an NFT even when verified', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT with that belongs to a verified collection.
  const collectionNft = await createCollectionNft(mx);
  const nft = await createNft(mx, {
    collection: collectionNft.address,
    collectionAuthority: mx.identity(),
  });
  t.true(nft.collection?.verified, 'has verified parent collection');
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 1);

  // When we update that NFT by removing its parent collection.
  await mx
    .nfts()
    .update({
      nftOrSft: nft,
      collection: null,
    })
    .run();

  // Then the updated NFT should now have no parent collection.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated NFT',
    model: 'nft',
    collection: null,
  } as unknown as Specifications<Nft>);

  // And the size of the collection NFT was decremented by 1.
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 0);
});
