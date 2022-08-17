import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { Metadata, Nft, Sft } from '../models';
import { TokenMetadataProgram } from '../program';
import { findNftsByMintListOperation } from './findNftsByMintList';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByUpdateAuthorityOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findNftsByUpdateAuthorityOperation =
  useOperation<FindNftsByUpdateAuthorityOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftsByUpdateAuthorityOperation = Operation<
  typeof Key,
  FindNftsByUpdateAuthorityInput,
  FindNftsByUpdateAuthorityOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftsByUpdateAuthorityInput = {
  updateAuthority: PublicKey;
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindNftsByUpdateAuthorityOutput = (Metadata | Nft | Sft)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findNftsByUpdateAuthorityOperationHandler: OperationHandler<FindNftsByUpdateAuthorityOperation> =
  {
    handle: async (
      operation: FindNftsByUpdateAuthorityOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftsByUpdateAuthorityOutput> => {
      const { updateAuthority, commitment } = operation.input;

      const mints = await TokenMetadataProgram.metadataV1Accounts(metaplex)
        .selectMint()
        .whereUpdateAuthority(updateAuthority)
        .getDataAsPublicKeys();
      scope.throwIfCanceled();

      const nfts = await metaplex
        .operations()
        .execute(findNftsByMintListOperation({ mints, commitment }), scope);
      scope.throwIfCanceled();

      return nfts.filter((nft): nft is Metadata | Nft | Sft => nft !== null);
    },
  };
