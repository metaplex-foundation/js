import { findAssociatedTokenAccountPda } from '@/plugins';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import {
  assertThrows,
  createCollectionNft,
  createNft,
  killStuckProcess,
  metaplex,
} from '../../helpers';
import { assertRefreshedCollectionHasSize } from './helpers';

killStuckProcess();

test('[nftModule] the owner of an NFT can delete it', async (t: Test) => {
  // Given an existing NFT.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const nft = await createNft(mx, { tokenOwner: owner.publicKey });

  // When the owner deletes the NFT.
  await mx.nfts().delete({ mintAddress: nft.address, owner }).run();

  // Then the NFT accounts no longer exist.
  const accounts = await mx
    .rpc()
    .getMultipleAccounts([
      nft.address,
      nft.token.address,
      nft.metadataAddress,
      nft.edition.address,
    ]);
  t.true(accounts[0].exists, 'mint account still exists because of SPL Token');
  t.false(accounts[1].exists, 'token account no longer exists');
  t.false(accounts[2].exists, 'metadata account no longer exists');
  t.false(accounts[3].exists, 'edition account no longer exists');
});

test('[nftModule] it decreases the collection size when deleting the NFT', async (t: Test) => {
  // Given an existing NFT part of a sized collection.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const collectionNft = await createCollectionNft(mx);
  const nft = await createNft(mx, {
    tokenOwner: owner.publicKey,
    collection: collectionNft.address,
    collectionAuthority: mx.identity(),
  });
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 1);

  // When the owner deletes the NFT and provides the collection address.
  await mx
    .nfts()
    .delete({
      mintAddress: nft.address,
      owner,
      collection: collectionNft.address,
    })
    .run();

  // Then the collection size has decreased.
  await assertRefreshedCollectionHasSize(t, mx, collectionNft, 0);

  // And the NFT accounts no longer exist.
  const accounts = await mx
    .rpc()
    .getMultipleAccounts([
      nft.address,
      nft.token.address,
      nft.metadataAddress,
      nft.edition.address,
    ]);
  t.true(accounts[0].exists, 'mint account still exists because of SPL Token');
  t.false(accounts[1].exists, 'token account no longer exists');
  t.false(accounts[2].exists, 'metadata account no longer exists');
  t.false(accounts[3].exists, 'edition account no longer exists');
});

test('[nftModule] the update authority of an NFT cannot delete it', async (t: Test) => {
  // Given an existing NFT.
  const mx = await metaplex();
  const owner = Keypair.generate();
  const updateAuthority = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: owner.publicKey,
    updateAuthority: updateAuthority,
  });

  // When the update authority tries to delete the NFT.
  const promise = mx
    .nfts()
    .delete({
      mintAddress: nft.address,
      owner: updateAuthority,
      ownerTokenAccount: findAssociatedTokenAccountPda(
        nft.mint.address,
        owner.publicKey
      ),
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /InvalidOwner: Invalid Owner/);

  // And the NFT accounts still exist.
  const accounts = await mx
    .rpc()
    .getMultipleAccounts([
      nft.address,
      nft.token.address,
      nft.metadataAddress,
      nft.edition.address,
    ]);
  t.true(accounts[0].exists, 'mint account still exists');
  t.true(accounts[1].exists, 'token account still exists');
  t.true(accounts[2].exists, 'metadata account still exists');
  t.true(accounts[3].exists, 'edition account still exists');
});
