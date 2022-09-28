import { Nft, toBigNumber } from '@/index';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  createNft,
  killStuckProcess,
  metaplex,
  spokSameBignum,
} from '../../helpers';

killStuckProcess();

test('[nftModule] it can migrate from a legacy collection to a sized collection', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing legacy collection.
  const collectionAuthority = Keypair.generate();
  const collection = await createNft(mx, {
    updateAuthority: collectionAuthority,
  });
  t.false(collection.collectionDetails, 'collection is legacy');

  // When we migrate the collection to a sized collection of 12345 items.
  await mx
    .nfts()
    .migrateToSizedCollection({
      mintAddress: collection.address,
      size: toBigNumber(12345),
      collectionAuthority,
    })
    .run();

  // Then the collection NFT has been updated to a sized collection.
  const updatedCollection = await mx.nfts().refresh(collection).run();
  spok(t, updatedCollection, {
    $topic: 'Updated Collection NFT',
    model: 'nft',
    collectionDetails: {
      version: 'V1',
      size: spokSameBignum(12345),
    },
  } as unknown as Specifications<Nft>);
});

test('[nftModule] it can migrate from a legacy collection to a sized collection using a delegated authority', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing legacy collection.
  const collectionAuthority = Keypair.generate();
  const collection = await createNft(mx, {
    updateAuthority: collectionAuthority,
  });
  t.false(collection.collectionDetails, 'collection is legacy');

  // And a delegated collection authority for that collection NFT.
  const delegatedCollectionAuthority = Keypair.generate();
  await mx
    .nfts()
    .approveCollectionAuthority({
      mintAddress: collection.address,
      collectionAuthority: delegatedCollectionAuthority.publicKey,
      updateAuthority: collectionAuthority,
    })
    .run();

  // When we migrate the collection to a sized collection using that delegated authority.
  await mx
    .nfts()
    .migrateToSizedCollection({
      mintAddress: collection.address,
      size: toBigNumber(12345),
      collectionAuthority: delegatedCollectionAuthority,
      isDelegated: true,
    })
    .run();

  // Then the collection NFT has been updated to a sized collection.
  const updatedCollection = await mx.nfts().refresh(collection).run();
  spok(t, updatedCollection, {
    $topic: 'Updated Collection NFT',
    model: 'nft',
    collectionDetails: {
      version: 'V1',
      size: spokSameBignum(12345),
    },
  } as unknown as Specifications<Nft>);
});
