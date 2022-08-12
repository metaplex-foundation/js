import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { toMintAccount, toTokenAccount } from './accounts';
import { TokenAndMintDoNotMatchError } from './errors';
import { toMint } from './Mint';
import { findAssociatedTokenAccountPda } from './pdas';
import { TokenWithMint, toTokenWithMint } from './Token';

// -----------------
// Operation
// -----------------

const Key = 'FindTokenWithMintByMintOperation' as const;

/** @group Operations */
export const findTokenWithMintByMintOperation =
  useOperation<FindTokenWithMintByMintOperation>(Key);

/** @group Operations */
export type FindTokenWithMintByMintOperation = Operation<
  typeof Key,
  FindTokenWithMintByMintInput,
  TokenWithMint
>;

/** @group Operations */
export type FindTokenWithMintByMintInput = {
  mint: PublicKey;
  address: PublicKey;
  addressType: 'owner' | 'token';
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

/** @group Operations */
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
