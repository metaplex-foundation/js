import { Nft } from '@/index';
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

killStuckProcess();

test('[nftModule] it can approve a collection authority for a given NFT', async (t: Test) => {
  // Given a Metaplex instance.
  const mx = await metaplex();

  // And an existing NFT with an unverified collection.
  const collectionAuthority = Keypair.generate();
  const collection = await createCollectionNft(mx, {
    updateAuthority: collectionAuthority,
  });
  const nft = await createNft(mx, {
    collection: collection.address,
  });
  t.true(nft.collection, 'nft has a collection');
  t.false(nft.collection?.verified, 'nft collection is not verified');
  await assertRefreshedCollectionHasSize(t, mx, collection, 0);

  // When we approve a new delegated collection authority.
  const delegatedCollectionAuthority = Keypair.generate();
  await mx
    .nfts()
    .approveCollectionAuthority({
      mintAddress: collection.address,
      collectionAuthority: delegatedCollectionAuthority.publicKey,
      updateAuthority: collectionAuthority,
    })
    .run();

  // Then that delegated authority can successfully verify the NFT.
  await mx
    .nfts()
    .verifyCollection({
      mintAddress: nft.address,
      collectionMintAddress: nft.collection!.address,
      collectionAuthority: delegatedCollectionAuthority,
      isDelegated: true,
    })
    .run();

  // And the NFT should now be verified.
  const updatedNft = await mx.nfts().refresh(nft).run();
  spok(t, updatedNft, {
    $topic: 'Updated Nft',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collection.address),
      verified: true,
    },
  } as unknown as Specifications<Nft>);

  // And the collection should have the updated size.
  await assertRefreshedCollectionHasSize(t, mx, collection, 1);
});
