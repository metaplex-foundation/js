import type { Commitment, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@/Metaplex';
import { Operation, useOperation, OperationHandler } from '@/types';
import { toMint, Mint } from './Mint';
import { toMintAccount } from './accounts';

// -----------------
// Operation
// -----------------

const Key = 'FindMintByAddressOperation' as const;
export const findMintByAddressOperation =
  useOperation<FindMintByAddressOperation>(Key);
export type FindMintByAddressOperation = Operation<
  typeof Key,
  FindMintByAddressInput,
  Mint
>;

export type FindMintByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

export const findMintByAddressOperationHandler: OperationHandler<FindMintByAddressOperation> =
  {
    handle: async (
      operation: FindMintByAddressOperation,
      metaplex: Metaplex
    ): Promise<Mint> => {
      const { address, commitment } = operation.input;

      const account = toMintAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      return toMint(account);
    },
  };
