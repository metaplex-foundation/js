import {
  DelegateRecord,
  DelegateRole,
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

test('[nftModule] it can create a collection delegate', async (t: Test) => {
  // Given an existing NFT.
  const mx = await metaplex();
  const nft = await createNft(mx);

  // When we approve a new collection delegate authority.
  const collectionDelegate = Keypair.generate();
  await mx.nfts().delegate({
    nftOrSft: nft,
    delegate: {
      type: 'CollectionV1',
      delegate: collectionDelegate.publicKey,
      updateAuthority: nft.updateAuthorityAddress,
    },
  });

  // Then a new delegate record was created.
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
});

test('[nftModule] it can create a transfer delegate', async (t: Test) => {
  // Given an existing NFT.
  const mx = await metaplex();
  const nftOwner = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: nftOwner.publicKey,
  });

  // When we approve a new transfer delegate authority.
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

  // Then a new delegate record was created.
  const delegateRecord = mx.nfts().pdas().persistentDelegateRecord({
    mint: nft.address,
    owner: nftOwner.publicKey,
  });
  t.true(
    await mx.rpc().accountExists(delegateRecord),
    'delegate record exists'
  );

  // And it contains the correct data.
  const delegateRecordAccount = await DelegateRecord.fromAccountAddress(
    mx.connection,
    delegateRecord
  );
  t.equal(delegateRecordAccount.role, DelegateRole.Transfer);
  t.true(delegateRecordAccount.delegate.equals(transferDelegate.publicKey));
});

test('[nftModule] it cannot create a transfer delegate without data', async (t: Test) => {
  // Given an existing NFT.
  const mx = await metaplex();
  const nftOwner = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: nftOwner.publicKey,
  });

  // When trying to approve a new transfer delegate
  // authority without providing any data.
  const transferDelegate = Keypair.generate();
  const promise = mx.nfts().delegate({
    nftOrSft: nft,
    authority: nftOwner,
    delegate: {
      type: 'TransferV1',
      delegate: transferDelegate.publicKey,
      owner: nftOwner.publicKey,
    },
  });

  // Then we expect an error.
  await assertThrows(t, promise, /DelegateRoleRequiredDataError/);
});
