import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { toTokenWithMint, TokenWithMint } from './Token';
import { toMintAccount, toTokenAccount } from './accounts';
import { toMint } from './Mint';
import { findAssociatedTokenAccountPda } from '@/programs';
import { TokenAndMintDoNotMatchError } from './errors';

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
  address: PublicKey;
  addressType: 'owner' | 'token';
  commitment?: Commitment;
};

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

      if (tokenAccount.data.mint !== mint) {
        throw new TokenAndMintDoNotMatchError(
          tokenAddress,
          tokenAccount.data.mint,
          mint
        );
      }

      return toTokenWithMint(tokenAccount, toMint(mintAccount));
    },
  };
