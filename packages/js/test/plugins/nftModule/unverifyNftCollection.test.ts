import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  createCollectionNft,
  createNft,
  killStuckProcess,
  metaplex,
  spokSamePubkey,
} from '../../helpers';
import { assertRefreshedCollectionHasSize } from './helpers';
import { Nft } from '@/index';

killStuckProcess();

test('[nftModule] it can unverify the collection of an NFT item', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT with an verified collection.
  const collectionAuthority = Keypair.generate();
  const collection = await createCollectionNft(mx, {
    updateAuthority: collectionAuthority,
  });
  const nft = await createNft(mx, {
    collection: collection.address,
    collectionAuthority,
  });
  t.true(nft.collection, 'nft has a collection');
  t.true(nft.collection?.verified, 'nft collection is verified');
  await assertRefreshedCollectionHasSize(t, mx, collection, 1);

  // When we unverify the collection.
  await mx.nfts().unverifyCollection({
    mintAddress: nft.address,
    collectionMintAddress: nft.collection!.address,
    collectionAuthority,
  });

  // Then the NFT collection should be unverified.
  const updatedNft = await mx.nfts().refresh(nft);
  spok(t, updatedNft, {
    $topic: 'Updated Nft',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collection.address),
      verified: false,
    },
  } as unknown as Specifications<Nft>);

  // And the collection should have the updated size.
  await assertRefreshedCollectionHasSize(t, mx, collection, 0);
});

test('[nftModule] it can unverify the legacy collection of an NFT item', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT with an verified legacy collection.
  const collectionAuthority = Keypair.generate();
  const collection = await createNft(mx, {
    updateAuthority: collectionAuthority,
  });
  const nft = await createNft(mx, {
    collection: collection.address,
    collectionAuthority,
    collectionIsSized: false,
  });
  t.true(nft.collection, 'nft has a collection');
  t.true(nft.collection?.verified, 'nft collection is verified');
  t.false(collection.collectionDetails, 'collection is legacy');

  // When we unverify the collection.
  await mx.nfts().unverifyCollection({
    mintAddress: nft.address,
    collectionMintAddress: nft.collection!.address,
    collectionAuthority,
    isSizedCollection: false,
  });

  // Then the NFT collection should be unverified.
  const updatedNft = await mx.nfts().refresh(nft);
  spok(t, updatedNft, {
    $topic: 'Updated Nft',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collection.address),
      verified: false,
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can unverify the collection of an NFT item as a metadata delegate', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT with an verified collection.
  const collectionAuthority = Keypair.generate();
  const collection = await createCollectionNft(mx, {
    updateAuthority: collectionAuthority,
  });
  const nft = await createNft(mx, {
    collection: collection.address,
    collectionAuthority,
  });
  t.true(nft.collection, 'nft has a collection');
  t.true(nft.collection?.verified, 'nft collection is verified');
  await assertRefreshedCollectionHasSize(t, mx, collection, 1);

  // And a metadata delegate approved by the collection's update authority.
  const collectionDelegate = Keypair.generate();
  await mx.nfts().delegate({
    nftOrSft: collection,
    authority: collectionAuthority,
    delegate: {
      type: 'CollectionV1',
      delegate: collectionDelegate.publicKey,
      updateAuthority: collection.updateAuthorityAddress,
    },
  });

  // When the metadata delegate unverifies the collection.
  await mx.nfts().unverifyCollection({
    mintAddress: nft.address,
    collectionMintAddress: nft.collection!.address,
    collectionAuthority: collectionDelegate,
    collectionUpdateAuthority: collectionAuthority.publicKey,
    isDelegated: 'metadataDelegate',
  });

  // Then the NFT collection should be unverified.
  const updatedNft = await mx.nfts().refresh(nft);
  spok(t, updatedNft, {
    $topic: 'Updated Nft',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collection.address),
      verified: false,
    },
  } as unknown as Specifications<Nft>);

  // And the collection should have the updated size.
  await assertRefreshedCollectionHasSize(t, mx, collection, 0);
});
