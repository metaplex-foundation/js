import { Metaplex } from '@/Metaplex';
import { TokenMetadataProgram } from '@/programs';
import { OperationHandler } from '@/drivers';
import { Nft } from '../models';
import { findNftsByMintListOperation, FindNftsByCreatorOperation } from '../operations';

export const findNftsByCreatorOnChainOperationHandler: OperationHandler<FindNftsByCreatorOperation> =
  {
    handle: async (operation: FindNftsByCreatorOperation, metaplex: Metaplex): Promise<Nft[]> => {
      const { creator, position = 1 } = operation.input;

      const mints = await TokenMetadataProgram.metadataV1Accounts(metaplex)
        .selectMint()
        .whereCreator(position, creator)
        .getDataAsPublicKeys();

      const nfts = await metaplex.operations().execute(findNftsByMintListOperation(mints));

      return nfts.filter((nft): nft is Nft => nft !== null);
    },
  };
