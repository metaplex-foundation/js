import { PublicKey } from '@solana/web3.js';
import { Token, TokenGpaBuilder, toToken, toTokenAccount } from '../../tokenModule';
import { Metadata, MetadataWithToken } from '../models';
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

const Key = 'FindNftsByOwnerOperation' as const;

/**
 * Finds multiple NFTs and SFTs by a given owner.
 *
 * ```ts
 * const nfts = await metaplex
 *   .nfts()
 *   .findAllByOwner({ owner };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findNftsByOwnerOperation =
  useOperation<FindNftsByOwnerOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindNftsByOwnerOperation = Operation<
  typeof Key,
  FindNftsByOwnerInput,
  FindNftsByOwnerOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindNftsByOwnerInput = {
  /** The address of the owner. */
  owner: PublicKey;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindNftsByOwnerOutput = (MetadataWithToken)[];

/**
 * @group Operations
 * @category Handlers
 */
export const findNftsByOwnerOperationHandler: OperationHandler<FindNftsByOwnerOperation> =
  {
    handle: async (
      operation: FindNftsByOwnerOperation,
      metaplex: Metaplex,
      scope: OperationScope
    ): Promise<FindNftsByOwnerOutput> => {
      const { programs } = scope;
      const { owner } = operation.input;

      const tokenProgram = metaplex.programs().getToken(programs);
      const tokenAccountsUnparsed = await new TokenGpaBuilder(metaplex, tokenProgram.address)
        .whereOwner(owner)
        .whereAmount(1)
        .get();
      scope.throwIfCanceled();

      const tokenAccounts = tokenAccountsUnparsed.map(tokenAccount => {
        try {
          return toToken(toTokenAccount(tokenAccount))
        } catch (error) {
          return null
        }
      }).filter((tokenAccount): tokenAccount is Token => tokenAccount !== null);

      const nfts = await metaplex.nfts().findAllByMintList({ mints: tokenAccounts.map(tokenAccount => tokenAccount.mintAddress) }, scope);
      scope.throwIfCanceled();

      return nfts.filter((nft): nft is Metadata => nft !== null ).map((nft) => {
        const token = tokenAccounts.find(tokenAccount => tokenAccount.mintAddress.toBase58() === nft.mintAddress.toBase58())!
        return {...nft, token}
      });
    },
  };
