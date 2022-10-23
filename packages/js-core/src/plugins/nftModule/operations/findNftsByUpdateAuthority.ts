import { PublicKey } from '@solana/web3.js';
import { MetadataV1GpaBuilder } from '../gpaBuilders';
import { Metadata, Nft, Sft } from '../models';
import {
  Operation,
  OperationHandler,
  OperationScope,
  useOperation,
} from '@/types';
import { Metaplex } from '@/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'FindNftsByUpdateAuthorityOperation' as const;

/**
 * Finds multiple NFTs and SFTs by a given update authority.
 *
 * ```ts
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByUpdateAuthority({ updateAuthority };
 * ```
 *
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
  /** The address of the update authority. */
  updateAuthority: PublicKey;
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
      scope: OperationScope
    ): Promise<FindNftsByUpdateAuthorityOutput> => {
      const { updateAuthority } = operation.input;

      const gpaBuilder = new MetadataV1GpaBuilder(
        metaplex,
        metaplex.programs().getTokenMetadata(scope.programs).address
      );

      const mints = await gpaBuilder
        .selectMint()
        .whereUpdateAuthority(updateAuthority)
        .getDataAsPublicKeys();
      scope.throwIfCanceled();

      const nfts = await metaplex.nfts().findAllByMintList({ mints }, scope);
      scope.throwIfCanceled();

      return nfts.filter((nft): nft is Metadata | Nft | Sft => nft !== null);
    },
  };
