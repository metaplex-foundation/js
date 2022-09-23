import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { toMintAccount, toTokenAccount } from '../accounts';
import { TokenAndMintDoNotMatchError } from '../errors';
import { toMint } from '../models/Mint';
import { findAssociatedTokenAccountPda } from '../pdas';
import { TokenWithMint, toTokenWithMint } from '../models/Token';

// -----------------
// Operation
// -----------------

const Key = 'FindTokenWithMintByMintOperation' as const;

/**
 * Finds a token account and its associated mint account
 * by providing the mint address and either:
 * - the token address or
 * - the address of the token's owner.
 *
 * ```ts
 * const tokenWithMint = await metaplex
 *   .tokens()
 *   .findTokenWithMintByMint({ mint, address: tokenAddress, type: "token" })
 *   .run();
 *
 * const tokenWithMint = await metaplex
 *   .tokens()
 *   .findTokenWithMintByMint({ mint, address: ownerAddress, type: "owner" })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findTokenWithMintByMintOperation =
  useOperation<FindTokenWithMintByMintOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindTokenWithMintByMintOperation = Operation<
  typeof Key,
  FindTokenWithMintByMintInput,
  TokenWithMint
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindTokenWithMintByMintInput = {
  /** The address of the mint account. */
  mint: PublicKey;

  /**
   * The address of the token account or its owner,
   * distinguished by the `addressType`` parameter.
   */
  address: PublicKey;

  /**
   * Determines whether the `address` parameter is the token address
   * or the address of its owner.
   */
  addressType: 'owner' | 'token';

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
export const findTokenWithMintByMintOperationHandler: OperationHandler<FindTokenWithMintByMintOperation> =
  {
    handle: async (
      operation: FindTokenWithMintByMintOperation,
      metaplex: Metaplex
    ): Promise<TokenWithMint> => {
      const { mint, address, addressType, commitment } = operation.input;
      const tokenAddress =
        addressType === 'owner'
          ? findAssociatedTokenAccountPda(mint, address)
          : address;

      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts([mint, tokenAddress], commitment);

      const mintAccount = toMintAccount(accounts[0]);
      const tokenAccount = toTokenAccount(accounts[1]);

      if (!tokenAccount.data.mint.equals(mint)) {
        throw new TokenAndMintDoNotMatchError(
          tokenAddress,
          tokenAccount.data.mint,
          mint
        );
      }

      return toTokenWithMint(tokenAccount, toMint(mintAccount));
    },
  };
