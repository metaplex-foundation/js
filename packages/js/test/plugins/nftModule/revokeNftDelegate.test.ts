import {
  TokenDelegateRole,
  TokenRecord,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import { Keypair } from '@solana/web3.js';
import test, { Test } from 'tape';
import {
  assertThrows,
  createNft,
  killStuckProcess,
  metaplex,
} from '../../helpers';

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
  const delegateRecord = mx.nfts().pdas().metadataDelegateRecord({
    mint: nft.address,
    type: 'CollectionV1',
    updateAuthority: nft.updateAuthorityAddress,
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

test('[nftModule] a collection delegate can revoke itself', async (t: Test) => {
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
  const delegateRecord = mx.nfts().pdas().metadataDelegateRecord({
    mint: nft.address,
    type: 'CollectionV1',
    updateAuthority: nft.updateAuthorityAddress,
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
    tokenStandard: TokenStandard.ProgrammableNonFungible,
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
  const tokenRecord = mx.nfts().pdas().tokenRecord({
    mint: nft.address,
    token: nft.token.address,
  });
  t.true(await mx.rpc().accountExists(tokenRecord), 'token record exists');

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

  // Then the token record was updated.
  const tokenRecordAccount = await TokenRecord.fromAccountAddress(
    mx.connection,
    tokenRecord
  );
  t.equal(tokenRecordAccount.delegate, null);
  t.equal(tokenRecordAccount.delegateRole, null);
});

test('[nftModule] a transfer delegate cannot revoke itself', async (t: Test) => {
  // Given an existing NFT with an approved transfer delegate.
  const mx = await metaplex();
  const nftOwner = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: nftOwner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
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
  const tokenRecord = mx.nfts().pdas().tokenRecord({
    mint: nft.address,
    token: nft.token.address,
  });
  t.true(await mx.rpc().accountExists(tokenRecord), 'token record exists');

  // When the transfer delegate tries to revoke itself.
  const promise = mx.nfts().revoke({
    nftOrSft: nft,
    authority: { __kind: 'self', delegate: transferDelegate },
    delegate: {
      type: 'TransferV1',
      delegate: transferDelegate.publicKey,
      owner: nftOwner.publicKey,
    },
  });

  // Then we expect an error.
  await assertThrows(t, promise, /IncorrectOwner/);

  // And the token record was not updated.
  const tokenRecordAccount = await TokenRecord.fromAccountAddress(
    mx.connection,
    tokenRecord
  );
  t.true(tokenRecordAccount.delegate?.equals(transferDelegate.publicKey));
  t.equal(tokenRecordAccount.delegateRole, TokenDelegateRole.Transfer);
});
