import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { toMintAccount, toTokenAccount } from './accounts';
import { toMint } from './Mint';
import { TokenWithMint, toTokenWithMint } from './Token';
import type { TokenClient } from './TokenClient';

// -----------------
// Clients
// -----------------

/** @internal */
export function _findTokenWithMintByAddressClient(
  this: TokenClient,
  address: PublicKey,
  options?: Omit<FindTokenWithMintByAddressInput, 'address'>
) {
  return this.metaplex
    .operations()
    .getTask(findTokenWithMintByAddressOperation({ address, ...options }));
}

// -----------------
// Operation
// -----------------

const Key = 'FindTokenWithMintByAddressOperation' as const;
export const findTokenWithMintByAddressOperation =
  useOperation<FindTokenWithMintByAddressOperation>(Key);
export type FindTokenWithMintByAddressOperation = Operation<
  typeof Key,
  FindTokenWithMintByAddressInput,
  TokenWithMint
>;

export type FindTokenWithMintByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

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
