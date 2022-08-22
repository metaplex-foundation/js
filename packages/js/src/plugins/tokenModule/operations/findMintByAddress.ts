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
 * Finds a mint account by its address.
 *
 * ```ts
 * const mint = await metaplex.tokens().findMintByAddress({ address }).run();
 * ```
 *
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
  /** The address of the mint account. */
  address: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
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
