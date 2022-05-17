import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { TokenProgram } from '@/programs';
import { Operation, OperationHandler, useOperation } from '@/types';
import { findNftsByMintListOperation } from './findNftsByMintList';
import { Nft } from './Nft';

const Key = 'FindNftsByOwnerOperation' as const;
export const findNftsByOwnerOperation =
  useOperation<FindNftsByOwnerOperation>(Key);
export type FindNftsByOwnerOperation = Operation<typeof Key, PublicKey, Nft[]>;

export const findNftsByOwnerOnChainOperationHandler: OperationHandler<FindNftsByOwnerOperation> =
  {
    handle: async (
      operation: FindNftsByOwnerOperation,
      metaplex: Metaplex
    ): Promise<Nft[]> => {
      const owner = operation.input;

      const mints = await TokenProgram.tokenAccounts(metaplex)
        .selectMint()
        .whereOwner(owner)
        .whereAmount(1)
        .getDataAsPublicKeys();

      const nfts = await metaplex
        .operations()
        .execute(findNftsByMintListOperation(mints));

      return nfts.filter((nft): nft is Nft => nft !== null);
    },
  };
