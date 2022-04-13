import { DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { OperationHandler } from '@/shared/index';
import { MetadataAccount } from '@/programs/index';
import { UpdateNftInput, UpdateNftOperation, UpdateNftOutput } from '../operations/index';
import { updateNftBuilder } from '../transactionBuilders/index';

export class UpdateNftOperationHandler extends OperationHandler<UpdateNftOperation> {
  public async handle(operation: UpdateNftOperation): Promise<UpdateNftOutput> {
    const {
      nft,
      newUpdateAuthority = nft.updateAuthority,
      primarySaleHappened = nft.primarySaleHappened,
      isMutable = nft.isMutable,
      updateAuthority = this.metaplex.identity(),
      confirmOptions,
    } = operation.input;

    const data = this.resolveData(operation.input);

    const metadata = await MetadataAccount.pda(nft.mint);

    const transactionId = await this.metaplex.sendAndConfirmTransaction(
      updateNftBuilder({
        data,
        newUpdateAuthority,
        primarySaleHappened,
        isMutable,
        updateAuthority,
        metadata,
      }),
      undefined,
      confirmOptions
    );

    return { transactionId };
  }

  protected resolveData(input: UpdateNftInput): DataV2 {
    const { nft } = input;

    return {
      name: input.name ?? nft.name,
      symbol: input.symbol ?? nft.symbol,
      uri: input.uri ?? nft.uri,
      sellerFeeBasisPoints: input.sellerFeeBasisPoints ?? nft.sellerFeeBasisPoints,
      creators: input.creators ?? nft.creators,
      collection: input.collection ?? nft.collection,
      uses: input.uses ?? nft.uses,
    };
  }
}
