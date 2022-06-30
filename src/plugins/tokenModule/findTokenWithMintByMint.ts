import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { makeTokenWithMintModel, TokenWithMint } from './Token';
import { toMintAccount, toTokenAccount } from './accounts';
import { makeMintModel } from './Mint';
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
  mintAddress: PublicKey;
  ownerAddress: PublicKey;
  commitment?: Commitment;
};

export const findTokenWithMintByMintOperationHandler: OperationHandler<FindTokenWithMintByMintOperation> =
  {
    handle: async (
      operation: FindTokenWithMintByMintOperation,
      metaplex: Metaplex
    ): Promise<TokenWithMint> => {
      const { mintAddress, ownerAddress, commitment } = operation.input;

      const tokenAddress = findAssociatedTokenAccountPda(
        mintAddress,
        ownerAddress
      );

      const accounts = await metaplex
        .rpc()
        .getMultipleAccounts([mintAddress, tokenAddress], commitment);

      const mintAccount = toMintAccount(accounts[0]);
      const tokenAccount = toTokenAccount(accounts[1]);

      return makeTokenWithMintModel(tokenAccount, makeMintModel(mintAccount));
    },
  };
