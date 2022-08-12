import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { toMintAccount } from './accounts';
import { Mint, toMint } from './Mint';

// -----------------
// Operation
// -----------------

const Key = 'FindMintByAddressOperation' as const;

/** @group Operations */
export const findMintByAddressOperation =
  useOperation<FindMintByAddressOperation>(Key);

/** @group Operations */
export type FindMintByAddressOperation = Operation<
  typeof Key,
  FindMintByAddressInput,
  Mint
>;

/** @group Operations */
export type FindMintByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

// -----------------
// Handler
// -----------------

/** @group Operations */
export const findMintByAddressOperationHandler: OperationHandler<FindMintByAddressOperation> =
  {
    handle: async (
      operation: FindMintByAddressOperation,
      metaplex: Metaplex
    ) => {
      const { address, commitment } = operation.input;

      const account = toMintAccount(
        await metaplex.rpc().getAccount(address, commitment)
      );

      return toMint(account);
    },
  };
