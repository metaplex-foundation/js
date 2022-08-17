import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, useOperation } from '@/types';
import type { Commitment, PublicKey } from '@solana/web3.js';
import { toMintAccount } from '../accounts';
import { Mint, toMint } from '../models/Mint';

// -----------------
// Operation
// -----------------

const Key = 'FindMintByAddressOperation' as const;

/**
 * @group Operations
 * @category Constructors
 */
export const findMintByAddressOperation =
  useOperation<FindMintByAddressOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindMintByAddressOperation = Operation<
  typeof Key,
  FindMintByAddressInput,
  Mint
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindMintByAddressInput = {
  address: PublicKey;
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Handlers
 */
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
