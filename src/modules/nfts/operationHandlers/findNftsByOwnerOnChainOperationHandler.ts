import { Metaplex } from '@/Metaplex';
import { TokenProgram } from '@/programs';
import { OperationHandler } from '@/shared';
import { Nft } from '../models';
import { findNftsByMintListOperation, FindNftsByOwnerOperation } from '../operations';

export const findNftsByOwnerOnChainOperationHandler: OperationHandler<FindNftsByOwnerOperation> = {
  handle: async (operation: FindNftsByOwnerOperation, metaplex: Metaplex): Promise<Nft[]> => {
    const owner = operation.input;

    const mints = await TokenProgram.tokenAccounts(metaplex)
      .selectMint()
      .whereOwner(owner)
      .whereAmount(1)
      .getDataAsPublicKeys();

    const nfts = await metaplex.execute(findNftsByMintListOperation(mints));

    return nfts.filter((nft): nft is Nft => nft !== null);
  },
};
