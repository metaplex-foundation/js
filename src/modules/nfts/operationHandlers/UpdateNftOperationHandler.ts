import { DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { OperationHandler } from '@/modules/shared';
import { MetadataAccount } from '@/programs';
import { InputStep, Plan } from '@/utils';
import { UpdateNftInput, UpdateNftOperation, UpdateNftOutput } from '../operations';
import { updateNftBuilder } from '../transactionBuilders';

export class UpdateNftOperationHandler extends OperationHandler<UpdateNftOperation> {
  public async handle(
    _operation: UpdateNftOperation
  ): Promise<Plan<UpdateNftInput, UpdateNftOutput>> {
    return Plan.make<UpdateNftInput>().addStep(this.updateNft());
  }

  protected updateNft(): InputStep<UpdateNftInput, UpdateNftOutput> {
    return {
      name: 'Update NFT',
      handler: async (input) => {
        const {
          nft,
          newUpdateAuthority = nft.updateAuthority,
          primarySaleHappened = nft.primarySaleHappened,
          isMutable = nft.isMutable,
          updateAuthority = this.metaplex.identity(),
        } = input;

        const data = this.resolveData(input);

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
          this.confirmOptions
        );
        return { transactionId };
      },
    };
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
