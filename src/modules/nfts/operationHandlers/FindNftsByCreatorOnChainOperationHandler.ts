import { Metaplex } from '@/Metaplex';
import { TokenMetadataProgram } from '@/programs';
import { useOperationHandler } from '@/shared';
import { Nft } from '../models';
import { findNftsByMintListOperation, FindNftsByCreatorOperation } from '../operations';

export const findNftsByCreatorOnChainOperationHandler =
  useOperationHandler<FindNftsByCreatorOperation>(
    async (metaplex: Metaplex, operation: FindNftsByCreatorOperation): Promise<Nft[]> => {
      const { creator, position = 1 } = operation.input;

      const mints = await TokenMetadataProgram.metadataV1Accounts(metaplex.connection)
        .selectMint()
        .whereCreator(position, creator)
        .getDataAsPublicKeys();

      const nfts = await metaplex.execute(findNftsByMintListOperation(mints));

      return nfts.filter((nft): nft is Nft => nft !== null);
    }
  );
