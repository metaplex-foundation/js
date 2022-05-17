import { PublicKey } from '@solana/web3.js';
import { Operation, OperationHandler, useOperation } from '@/types';
import { Metaplex } from '@/Metaplex';
import { TokenMetadataProgram } from '@/programs';
import { findNftsByMintListOperation } from './findNftsByMintList';
import { Nft } from './Nft';

const Key = 'FindNftsByCreatorOperation' as const;
export const findNftsByCreatorOperation =
  useOperation<FindNftsByCreatorOperation>(Key);
export type FindNftsByCreatorOperation = Operation<
  typeof Key,
  FindNftsByCreatorInput,
  Nft[]
>;

export interface FindNftsByCreatorInput {
  creator: PublicKey;
  position?: number;
}

export const findNftsByCreatorOnChainOperationHandler: OperationHandler<FindNftsByCreatorOperation> =
  {
    handle: async (
      operation: FindNftsByCreatorOperation,
      metaplex: Metaplex
    ): Promise<Nft[]> => {
      const { creator, position = 1 } = operation.input;

      const mints = await TokenMetadataProgram.metadataV1Accounts(metaplex)
        .selectMint()
        .whereCreator(position, creator)
        .getDataAsPublicKeys();

      const nfts = await metaplex
        .operations()
        .execute(findNftsByMintListOperation(mints));

      return nfts.filter((nft): nft is Nft => nft !== null);
    },
  };
