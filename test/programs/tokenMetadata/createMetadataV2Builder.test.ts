import test, { Test } from 'tape';
import { Keypair } from '@solana/web3.js';
import {
  findEditionPda,
  findMetadataPda,
  token,
  TransactionBuilder,
} from '@/index';
import { metaplex, killStuckProcess, amman } from '../../helpers';
import {
  createCreateMasterEditionV3Instruction,
  createCreateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';

killStuckProcess();

/*
 * Regression test.
 * @see https://github.com/metaplex-foundation/metaplex-program-library/issues/383
 */
test('it works when we give an explicit payer for the create metadata ix only', async (t: Test) => {
  // Given we have everything we need to create a Metadata account.
  const mx = await metaplex();
  const mint = Keypair.generate();
  const metadata = findMetadataPda(mint.publicKey);
  const edition = findEditionPda(mint.publicKey);
  const { uri } = await mx
    .nfts()
    .uploadMetadata({ name: 'Metadata Name' })
    .run();
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
      await mx
        .tokens()
        .builders()
        .createTokenWithMint({
          initialSupply: token(1),
          mint,
          payer: mx.identity(),
        })
    )
    .add({
      instruction: createCreateMetadataAccountV2Instruction(
        {
          metadata,
          mint: mint.publicKey,
          mintAuthority: mx.identity().publicKey,
          payer: explicitPayer.publicKey,
          updateAuthority: mx.identity().publicKey,
        },
        { createMetadataAccountArgsV2: { data, isMutable: false } }
      ),
      signers: [explicitPayer],
    })
    .add({
      instruction: createCreateMasterEditionV3Instruction(
        {
          edition,
          mint: mint.publicKey,
          updateAuthority: mx.identity().publicKey,
          mintAuthority: mx.identity().publicKey,
          payer: explicitPayer.publicKey,
          metadata,
        },
        {
          createMasterEditionArgs: { maxSupply: 0 },
        }
      ),
      signers: [explicitPayer],
    });

  // And send it with confirmation.
  await mx.rpc().sendAndConfirmTransaction(tx);

  // Then the transaction succeeded and the NFT was created.
  const nft = await mx.nfts().findByMint(mint.publicKey).run();
  t.equal(nft.name, 'My NFT');
  t.equal(nft.metadataAddress.toBase58(), metadata.toBase58());
});
