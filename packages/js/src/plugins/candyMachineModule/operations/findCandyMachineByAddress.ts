import { Metaplex } from '@/Metaplex';
import { Operation, OperationHandler, PublicKey, useOperation } from '@/types';
import { DisposableScope } from '@/utils';
import { Commitment } from '@solana/web3.js';
import { CandyMachine } from '../models';

// -----------------
// Operation
// -----------------

const Key = 'FindCandyMachineByAddressOperation' as const;

/**
 * TODO
 *
 * ```ts
 * const { candyMachine } = await metaplex
 *   .candyMachines()
 *   .create({
 *   })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const findCandyMachineByAddressOperation =
  useOperation<FindCandyMachineByAddressOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type FindCandyMachineByAddressOperation = Operation<
  typeof Key,
  FindCandyMachineByAddressInput,
  FindCandyMachineByAddressOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type FindCandyMachineByAddressInput = {
  /** The Candy Machine address. */
  address: PublicKey;

  /** The level of commitment desired when querying the blockchain. */
  commitment?: Commitment;
};

/**
 * @group Operations
 * @category Outputs
 */
export type FindCandyMachineByAddressOutput = CandyMachine;

/**
 * @group Operations
 * @category Handlers
 */
export const findCandyMachineByAddressOperationHandler: OperationHandler<FindCandyMachineByAddressOperation> =
  {
    async handle(
      operation: FindCandyMachineByAddressOperation,
      metaplex: Metaplex,
      scope: DisposableScope
    ): Promise<FindCandyMachineByAddressOutput> {
      //
    },
  };
