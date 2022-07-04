import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { toTokenWithMint, TokenWithMint } from './Token';
import { toMintAccount, toTokenAccount } from './accounts';
import { toMint } from './Mint';
import { findAssociatedTokenAccountPda } from '@/programs';

const Key = 'FindTokenWithMintByMintOperation' as const;
export const findTokenWithMintByMintOperation =
  useOperation<FindTokenWithMintByMintOperation>(Key);
export type FindTokenWithMintByMintOperation = Operation<
  typeof Key,
  FindTokenWithMintByMintInput,
  TokenWithMint
>;

export type FindTokenWithMintByMintInput = {
  mint: PublicKey;
  owner: PublicKey;
  commitment?: Commitment;
};

export const findTokenWithMintByMintOperationHandler: OperationHandler<FindTokenWithMintByMintOperation> =
  {
    handle: async (
      operation: FindTokenWithMintByMintOperation,
      metaplex: Metaplex
    ): Promise<TokenWithMint> => {
      const { mint, owner, commitment } = operation.input;
      const tokenAddress = findAssociatedTokenAccountPda(mint, owner);

      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts([mint, tokenAddress], commitment);

      const mintAccount = toMintAccount(accounts[0]);
      const tokenAccount = toTokenAccount(accounts[1]);

      return toTokenWithMint(tokenAccount, toMint(mintAccount));
    },
  };
