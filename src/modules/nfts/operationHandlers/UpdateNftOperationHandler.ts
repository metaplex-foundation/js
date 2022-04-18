import { DataV2 } from '@metaplex-foundation/mpl-token-metadata';
import { Metaplex } from '@/Metaplex';
import { useOperationHandler } from '@/shared';
import { MetadataAccount } from '@/programs';
import { UpdateNftInput, UpdateNftOperation, UpdateNftOutput } from '../operations';
import { updateNftBuilder } from '../transactionBuilders';

export const updateNftOperationHandler = useOperationHandler<UpdateNftOperation>(
  async (metaplex: Metaplex, operation: UpdateNftOperation): Promise<UpdateNftOutput> => {
    const {
      nft,
      newUpdateAuthority = nft.updateAuthority,
      primarySaleHappened = nft.primarySaleHappened,
      isMutable = nft.isMutable,
      updateAuthority = metaplex.identity(),
      confirmOptions,
    } = operation.input;

    const data = resolveData(operation.input);

    const metadata = await MetadataAccount.pda(nft.mint);

    const transactionId = await metaplex.sendAndConfirmTransaction(
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
);

const resolveData = (input: UpdateNftInput): DataV2 => {
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
};
