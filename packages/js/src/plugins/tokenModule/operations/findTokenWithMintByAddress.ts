import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { toMintAccount, toTokenAccount } from '../accounts';
import { toMint } from '../models/Mint';
import { TokenWithMint, toTokenWithMint } from '../models/Token';

// -----------------
// Operation
// -----------------

const Key = 'FindTokenWithMintByAddressOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findTokenWithMintByAddressOperation =
  useOperation<FindTokenWithMintByAddressOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindTokenWithMintByAddressOperation = Operation<
  typeof Key,
  FindTokenWithMintByAddressInput,
  TokenWithMint
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindTokenWithMintByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findTokenWithMintByAddressOperationHandler: OperationHandler<FindTokenWithMintByAddressOperation> =
  {
    handle: async (
      operation: FindTokenWithMintByAddressOperation,
      metaplex: Metaplex
    ): Promise<TokenWithMint> => {
      const { address, commitment } = operation.input;

      const tokenAccount = toTokenAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      const mintAccount = toMintAccount(
        await metaplex.rpc().getAccount(tokenAccount.data.mint, commitment)
      );

      return toTokenWithMint(tokenAccount, toMint(mintAccount));
    },
  };
