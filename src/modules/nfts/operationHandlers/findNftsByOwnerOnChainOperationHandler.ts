import { Metaplex } from '@/Metaplex';
import { TokenProgram } from '@/programs';
import { useOperationHandler } from '@/shared';
import { Nft } from '../models';
import { findNftsByMintListOperation, FindNftsByOwnerOperation } from '../operations';

export const findNftsByOwnerOnChainOperationHandler = useOperationHandler<FindNftsByOwnerOperation>(
  async (metaplex: Metaplex, operation: FindNftsByOwnerOperation): Promise<Nft[]> => {
    const owner = operation.input;

    const mints = await TokenProgram.tokenAccounts(metaplex.connection)
      .selectMint()
      .whereOwner(owner)
      .whereAmount(1)
      .getDataAsPublicKeys();

    const nfts = await metaplex.execute(findNftsByMintListOperation(mints));

    return nfts.filter((nft): nft is Nft => nft !== null);
  }
);
