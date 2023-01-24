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

test('[nftModule] it can approve a collection delegate', async (t: Test) => {
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
});

test('[nftModule] it can approve a transfer delegate', async (t: Test) => {
  // Given an existing PNFT.
  const mx = await metaplex();
  const nftOwner = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: nftOwner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
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

  // Then a new token record was created.
  const tokenRecord = mx.nfts().pdas().tokenRecord({
    mint: nft.address,
    token: nft.token.address,
  });
  t.true(await mx.rpc().accountExists(tokenRecord), 'token record exists');

  // And it contains the correct data.
  const tokenRecordAccount = await TokenRecord.fromAccountAddress(
    mx.connection,
    tokenRecord
  );
  t.true(tokenRecordAccount.delegate?.equals(transferDelegate.publicKey));
  t.equal(tokenRecordAccount.delegateRole, TokenDelegateRole.Transfer);
});

test('[nftModule] it cannot approve a transfer delegate without data', async (t: Test) => {
  // Given an existing NFT.
  const mx = await metaplex();
  const nftOwner = Keypair.generate();
  const nft = await createNft(mx, {
    tokenOwner: nftOwner.publicKey,
    tokenStandard: TokenStandard.ProgrammableNonFungible,
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
