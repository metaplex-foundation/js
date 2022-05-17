import test, { Test } from 'tape';
import { TransactionBuilder } from '@/index';
import {
  createMetadataV2Builder,
  createMintAndMintToAssociatedTokenBuilder,
  MetadataAccount,
} from '@/programs';
import { metaplex, killStuckProcess, amman } from '../../helpers';
import { Keypair } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
} from '@solana/spl-token';

killStuckProcess();

/*
 * Regression test.
 * @see https://github.com/metaplex-foundation/metaplex-program-library/issues/383
 */
test('it works when we give an explicit payer for the create metadata ix only', async (t: Test) => {
  // Given we have everything we need to create a Metadata account.
  const mx = await metaplex();
  const mint = Keypair.generate();
  const associatedToken = await getAssociatedTokenAddress(
    mint.publicKey,
    mx.identity().publicKey
  );
  const metadata = await MetadataAccount.pda(mint.publicKey);
  const lamports = await getMinimumBalanceForRentExemptMint(mx.connection);
  const { uri } = await mx.nfts().uploadMetadata({ name: 'Metadata Name' });
  const data = {
    name: 'My NFT',
    symbol: 'MNFT',
    sellerFeeBasisPoints: 10,
    uri,
    creators: [
      {
        address: mx.identity().publicKey,
        share: 100,
        verified: false,
      },
    ],
    collection: null,
    uses: null,
  };

  // And an explicit payer account that is only used to pay for the Metadata account storage.
  const explicitPayer = Keypair.generate();
  await amman.airdrop(mx.connection, explicitPayer.publicKey, 1);

  // When we assemble that transaction.
  const tx = TransactionBuilder.make()
    .add(
      createMintAndMintToAssociatedTokenBuilder({
        lamports,
        decimals: 0,
        amount: 1,
        createAssociatedToken: true,
        mint,
        payer: mx.identity(),
        mintAuthority: mx.identity(),
        owner: mx.identity().publicKey,
        associatedToken,
      })
    )
    .add(
      createMetadataV2Builder({
        data,
        isMutable: false,
        mintAuthority: mx.identity(),
        payer: explicitPayer,
        mint: mint.publicKey,
        metadata,
        updateAuthority: mx.identity().publicKey,
      })
    );

  // And send it with confirmation.
  await mx.rpc().sendAndConfirmTransaction(tx);

  // Then the transaction succeeded and the NFT was created.
  const nft = await mx.nfts().findByMint(mint.publicKey);
  t.equal(nft.name, 'My NFT');
  t.equal(nft.metadataAccount.publicKey.toBase58(), metadata.toBase58());
});
