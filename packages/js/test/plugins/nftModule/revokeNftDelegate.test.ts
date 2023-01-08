import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import { createNft, killStuckProcess, metaplex } from '../../helpers';

killStuckProcess();

test('[nftModule] it can revoke a collection delegate', async (t: Test) => {
  // Given an existing NFT with an approved collection delegate.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const collectionDelegate = Keypair.generate();
  await mx.nfts().delegate({
    nftOrSft: nft,
    delegate: {
      type: 'CollectionV1',
      delegate: collectionDelegate.publicKey,
      updateAuthority: nft.updateAuthorityAddress,
    },
  });
  const delegateRecord = mx.nfts().pdas().delegateRecord({
    mint: nft.address,
    type: 'CollectionV1',
    approver: nft.updateAuthorityAddress,
    delegate: collectionDelegate.publicKey,
  });
  t.true(
    await mx.rpc().accountExists(delegateRecord),
    'delegate record exists'
  );

  // When the update authority revokes the delegate.
  await mx.nfts().revoke({
    nftOrSft: nft,
    delegate: {
      type: 'CollectionV1',
      delegate: collectionDelegate.publicKey,
      updateAuthority: nft.updateAuthorityAddress,
    },
  });

  // Then the delegate record was deleted.
  t.false(
    await mx.rpc().accountExists(delegateRecord),
    'delegate record does not exist'
  );
});

// TODO: Waiting on the program to support this.
test.skip('[nftModule] a collection delegate can revoke itself', async (t: Test) => {
  // Given an existing NFT with an approved collection delegate.
  const mx = await metaplex();
  const nft = await createNft(mx);
  const collectionDelegate = Keypair.generate();
  await mx.nfts().delegate({
    nftOrSft: nft,
    delegate: {
      type: 'CollectionV1',
      delegate: collectionDelegate.publicKey,
      updateAuthority: nft.updateAuthorityAddress,
    },
  });
  const delegateRecord = mx.nfts().pdas().delegateRecord({
    mint: nft.address,
    type: 'CollectionV1',
    approver: nft.updateAuthorityAddress,
    delegate: collectionDelegate.publicKey,
  });
  t.true(
    await mx.rpc().accountExists(delegateRecord),
    'delegate record exists'
  );

  // When the collection delegate revokes itself.
  await mx.nfts().revoke({
    nftOrSft: nft,
    authority: { __kind: 'self', delegate: collectionDelegate },
    delegate: {
      type: 'CollectionV1',
      delegate: collectionDelegate.publicKey,
      updateAuthority: nft.updateAuthorityAddress,
    },
  });

  // Then the delegate record was deleted.
  t.false(
    await mx.rpc().accountExists(delegateRecord),
    'delegate record does not exist'
  );
});

test('[nftModule] it can revoke a transfer delegate', async (t: Test) => {
  // Given an existing NFT with an approved transfer delegate.
  const mx = await metaplex();
  const nftOwner = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: nftOwner.publicKey,
  });
  const transferDelegate = Keypair.generate();
  await mx.nfts().delegate({
    nftOrSft: nft,
    authority: nftOwner,
    delegate: {
      type: 'TransferV1',
      delegate: transferDelegate.publicKey,
      owner: nftOwner.publicKey,
      data: { amount: 1 },
    },
  });
  const delegateRecord = mx.nfts().pdas().persistentDelegateRecord({
    mint: nft.address,
    owner: nftOwner.publicKey,
  });
  t.true(
    await mx.rpc().accountExists(delegateRecord),
    'delegate record exists'
  );

  // When the NFT owner revokes the delegate.
  await mx.nfts().revoke({
    nftOrSft: nft,
    authority: nftOwner,
    delegate: {
      type: 'TransferV1',
      delegate: transferDelegate.publicKey,
      owner: nftOwner.publicKey,
    },
  });

  // Then the delegate record was deleted.
  t.false(
    await mx.rpc().accountExists(delegateRecord),
    'delegate record does not exist'
  );
});

// TODO: Waiting on the program to support this.
test.skip('[nftModule] a transfer delegate can revoke itself', async (t: Test) => {
  // Given an existing NFT with an approved transfer delegate.
  const mx = await metaplex();
  const nftOwner = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: nftOwner.publicKey,
  });
  const transferDelegate = Keypair.generate();
  await mx.nfts().delegate({
    nftOrSft: nft,
    authority: nftOwner,
    delegate: {
      type: 'TransferV1',
      delegate: transferDelegate.publicKey,
      owner: nftOwner.publicKey,
      data: { amount: 1 },
    },
  });
  const delegateRecord = mx.nfts().pdas().persistentDelegateRecord({
    mint: nft.address,
    owner: nftOwner.publicKey,
  });
  t.true(
    await mx.rpc().accountExists(delegateRecord),
    'delegate record exists'
  );

  // When the transfer delegate revokes itself.
  await mx.nfts().revoke({
    nftOrSft: nft,
    authority: { __kind: 'self', delegate: transferDelegate },
    delegate: {
      type: 'TransferV1',
      delegate: transferDelegate.publicKey,
      owner: nftOwner.publicKey,
    },
  });

  // Then the delegate record was deleted.
  t.false(
    await mx.rpc().accountExists(delegateRecord),
    'delegate record does not exist'
  );
});
