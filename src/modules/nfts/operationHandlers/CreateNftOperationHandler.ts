import { Keypair, PublicKey } from '@solana/web3.js';
import { getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress } from '@solana/spl-token';
import { MetadataAccount, MasterEditionAccount } from '@/programs/tokenMetadata';
import { Creator, DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { OperationHandler } from '@/shared';
import { CreateNftInput, CreateNftOperation, CreateNftOutput } from '../operations';
import { JsonMetadata } from '../models/JsonMetadata';
import { createNftBuilder } from '../transactionBuilders';

export class CreateNftOperationHandler extends OperationHandler<CreateNftOperation> {
  public async handle(operation: CreateNftOperation): Promise<CreateNftOutput> {
    const {
      uri,
      isMutable,
      maxSupply,
      allowHolderOffCurve = false,
      mint = Keypair.generate(),
      payer = this.metaplex.identity(),
      mintAuthority = payer,
      updateAuthority = mintAuthority,
      owner = mintAuthority.publicKey,
      freezeAuthority,
      tokenProgram,
      associatedTokenProgram,
    } = operation.input;

    const metadata: JsonMetadata = await this.metaplex.storage().downloadJson(uri);
    const data = this.resolveData(operation.input, metadata, updateAuthority.publicKey);

    const metadataPda = await MetadataAccount.pda(mint.publicKey);
    const masterEditionPda = await MasterEditionAccount.pda(mint.publicKey);
    const lamports = await getMinimumBalanceForRentExemptMint(this.metaplex.connection);
    const associatedToken = await getAssociatedTokenAddress(
      mint.publicKey,
      owner,
      allowHolderOffCurve,
      tokenProgram,
      associatedTokenProgram
    );

    const transactionId = await this.metaplex.sendAndConfirmTransaction(
      createNftBuilder({
        lamports,
        data,
        isMutable,
        maxSupply,
        mint,
        payer,
        mintAuthority,
        updateAuthority,
        owner,
        associatedToken,
        freezeAuthority,
        metadata: metadataPda,
        masterEdition: masterEditionPda,
        tokenProgram,
        associatedTokenProgram,
      }),
      undefined,
      this.confirmOptions
    );

    return {
      mint,
      metadata: metadataPda,
      masterEdition: masterEditionPda,
      associatedToken,
      transactionId,
    };
  }

  protected resolveData(
    input: CreateNftInput,
    metadata: JsonMetadata,
    updateAuthority: PublicKey
  ): DataV2 {
    const metadataCreators: Creator[] | undefined = metadata.properties?.creators
      ?.filter((creator) => creator.address)
      .map((creator) => ({
        address: new PublicKey(creator.address as string),
        share: creator.share ?? 0,
        verified: false,
      }));

    let creators = input.creators ?? metadataCreators ?? null;

    if (creators === null) {
      creators = [
        {
          address: updateAuthority,
          share: 100,
          verified: true,
        },
      ];
    } else {
      creators = creators.map((creator) => {
        if (creator.address.toBase58() === updateAuthority.toBase58()) {
          return { ...creator, verified: true };
        } else {
          return creator;
        }
      });
    }

    return {
      name: input.name ?? metadata.name ?? '',
      symbol: input.symbol ?? metadata.symbol ?? '',
      uri: input.uri,
      sellerFeeBasisPoints: input.sellerFeeBasisPoints ?? metadata.seller_fee_basis_points ?? 500,
      creators,
      collection: input.collection ?? null,
      uses: input.uses ?? null,
    };
  }
}
