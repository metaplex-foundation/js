import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { makeTokenModel, Token } from './Token';
import { toTokenAccount } from './accounts';

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

export const findTokenByAddressOnChainOperationHandler: OperationHandler<FindTokenByAddressOperation> =
  {
    handle: async (
      operation: FindTokenByAddressOperation,
      metaplex: Metaplex
    ): Promise<Token> => {
      const { address, commitment } = operation.input;

      const account = toTokenAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      return makeTokenModel(account);
    },
  };
