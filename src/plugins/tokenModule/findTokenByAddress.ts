import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { toToken, Token } from './Token';
import { toTokenAccount } from './accounts';

// -----------------
// Operation
// -----------------

const Key = 'FindTokenByAddressOperation' as const;
export const findTokenByAddressOperation =
  useOperation<FindTokenByAddressOperation>(Key);
export type FindTokenByAddressOperation = Operation<
  typeof Key,
  FindTokenByAddressInput,
  Token
>;

export type FindTokenByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findTokenByAddressOperationHandler: OperationHandler<FindTokenByAddressOperation> =
  {
    handle: async (
      operation: FindTokenByAddressOperation,
      metaplex: Metaplex
    ): Promise<Token> => {
      const { address, commitment } = operation.input;

      const account = toTokenAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      return toToken(account);
    },
  };
