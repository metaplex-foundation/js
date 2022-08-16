import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment, PublicKey } from '@solana/web3.js';
import { toMetadataAccount } from '../accounts';
import { Nft, NftWithToken, Sft, SftWithToken } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'FindNftByMetadataOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findNftByMetadataOperation =
  useOperation<FindNftByMetadataOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftByMetadataOperation = Operation<
  typeof Key,
  FindNftByMetadataInput,
  FindNftByMetadataOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftByMetadataInput = {
  metadata: PublicKey;
  tokenAddress?: PublicKey;
  tokenOwner?: PublicKey;
  loadJsonMetadata?: boolean;
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindNftByMetadataOutput = Nft | Sft | NftWithToken | SftWithToken;

/**
 * @group Operations
 * @category Handlers
 */
export const findNftByMetadataOperationHandler: OperationHandler<FindNftByMetadataOperation> =
  {
    handle: async (
      operation: FindNftByMetadataOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindNftByMetadataOutput> => {
      const metadata = toMetadataAccount(
        await metaplex.rpc().getAccount(operation.input.metadata)
      );
      scope.throwIfCanceled();

      return metaplex
        .nfts()
        .findByMint({
          ...operation.input,
          mintAddress: metadata.data.mint,
        })
        .run(scope);
    },
  };
