import { Nft } from '@/index';
import { Keypair } from '@solana/web3.js';
import spok, { Specifications } from 'spok';
import test, { Test } from 'tape';
import {
  assertThrows,
  createCollectionNft,
  createNft,
  killStuckProcess,
  metaplex,
  spokSamePubkey,
} from '../../helpers';
import { assertRefreshedCollectionHasSize } from './helpers';

killStuckProcess();

test('[nftModule] it can revoke a collection authority for a given NFT', async (t: Test) => {
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

  // And a delegated collection authority for that collection.
  const delegatedCollectionAuthority = Keypair.generate();
  await mx
    .nfts()
    .approveCollectionAuthority({
      mintAddress: collection.address,
      collectionAuthority: delegatedCollectionAuthority.publicKey,
      updateAuthority: collectionAuthority,
    })
    .run();

  // When we revoke that authority.
  await mx
    .nfts()
    .revokeCollectionAuthority({
      mintAddress: collection.address,
      collectionAuthority: delegatedCollectionAuthority.publicKey,
      revokeAuthority: collectionAuthority,
    })
    .run();

  // Then we expect an error when we try to verify the NFT using that delegated authority.
  const promise = mx
    .nfts()
    .verifyCollection({
      mintAddress: nft.address,
      collectionMintAddress: nft.collection!.address,
      collectionAuthority: delegatedCollectionAuthority,
      isDelegated: true,
    })
    .run();
  await assertThrows(t, promise, /Collection Update Authority is invalid/);

  // And the NFT collection should still be unverified.
  const refreshedNft = await mx.nfts().refresh(nft).run();
  spok(t, refreshedNft, {
    $topic: 'Refreshed Nft',
    model: 'nft',
    collection: {
      address: spokSamePubkey(collection.address),
      verified: false,
    },
  } as unknown as Specifications<Nft>);

  // And the collection size should still be 0.
  await assertRefreshedCollectionHasSize(t, mx, collection, 0);
});
