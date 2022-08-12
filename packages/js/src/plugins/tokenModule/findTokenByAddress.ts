import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { toTokenAccount } from './accounts';
import { Token, toToken } from './Token';

// -----------------
// Operation
// -----------------

const Key = 'FindTokenByAddressOperation' as const;

/** @group Operations */
export const findTokenByAddressOperation =
  useOperation<FindTokenByAddressOperation>(Key);

/** @group Operations */
export type FindTokenByAddressOperation = Operation<
  typeof Key,
  FindTokenByAddressInput,
  Token
>;

/** @group Operations */
export type FindTokenByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

/** @group Operations */
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
